/**
 * 简单的内存速率限制器
 * 用于限制 API 请求频率，防止滥用
 * 
 * 注意：这是一个基于内存的实现，不适用于多实例部署
 * 生产环境建议使用 Redis-based 解决方案（如 upstash/ratelimit）
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// 最大存储条目数，防止内存泄漏
const MAX_STORE_SIZE = 10000

// 内存存储
const rateLimitStore = new Map<string, RateLimitEntry>()

// 跟踪是否已初始化清理定时器（防止 SSR 环境下多次初始化）
let cleanupIntervalId: ReturnType<typeof setInterval> | null = null

/**
 * 清理过期条目和强制限制 Map 大小
 */
function cleanupExpiredEntries(): void {
  const now = Date.now()
  
  // 删除过期条目
  const entries = Array.from(rateLimitStore.entries())
  for (const [key, entry] of entries) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
  
  // 如果 Map 仍然过大，强制删除最旧的条目
  if (rateLimitStore.size > MAX_STORE_SIZE) {
    const entries = Array.from(rateLimitStore.entries())
    // 按 resetAt 排序，删除最早过期的条目
    entries.sort((a, b) => a[1].resetAt - b[1].resetAt)
    
    const entriesToRemove = entries.slice(0, entries.length - MAX_STORE_SIZE)
    for (const [key] of entriesToRemove) {
      rateLimitStore.delete(key)
    }
  }
}

// 初始化清理定时器（只执行一次）
function initCleanupInterval(): void {
  if (typeof setInterval === "undefined") {
    return
  }
  
  // 如果已经有定时器，不再创建新的
  if (cleanupIntervalId !== null) {
    return
  }
  
  // 每分钟清理一次过期条目
  cleanupIntervalId = setInterval(() => {
    cleanupExpiredEntries()
  }, 60 * 1000)
  
  // 如果在 Node.js 环境，使用 unref 防止定时器阻止进程退出
  if (typeof cleanupIntervalId === "object" && "unref" in cleanupIntervalId) {
    cleanupIntervalId.unref()
  }
}

// 初始化清理定时器
initCleanupInterval()

export interface RateLimitConfig {
  /** 时间窗口内允许的最大请求数 */
  limit: number
  /** 时间窗口（毫秒） */
  windowMs: number
}

export interface RateLimitResult {
  /** 是否允许请求 */
  success: boolean
  /** 剩余请求数 */
  remaining: number
  /** 重置时间戳 */
  resetAt: number
  /** 时间窗口内的限制 */
  limit: number
}

/**
 * 检查并更新速率限制
 * @param identifier 唯一标识符（如 IP 地址）
 * @param config 速率限制配置
 * @returns 速率限制结果
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const key = identifier
  const entry = rateLimitStore.get(key)

  // 在添加新条目前，检查 Map 大小
  // 如果快要超过限制，触发一次清理
  if (rateLimitStore.size >= MAX_STORE_SIZE - 100) {
    cleanupExpiredEntries()
  }

  // 如果条目不存在或已过期，创建新条目
  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    }
    rateLimitStore.set(key, newEntry)
    return {
      success: true,
      remaining: config.limit - 1,
      resetAt: newEntry.resetAt,
      limit: config.limit,
    }
  }

  // 检查是否超过限制
  if (entry.count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      limit: config.limit,
    }
  }

  // 增加计数
  entry.count++
  rateLimitStore.set(key, entry)

  return {
    success: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
    limit: config.limit,
  }
}

/**
 * 从请求中获取客户端标识符
 * 优先使用 X-Forwarded-For 头，否则使用固定标识符
 */
export function getClientIdentifier(request: Request): string {
  // 尝试从 headers 获取真实 IP
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    // 取第一个 IP（客户端真实 IP）
    return forwardedFor.split(",")[0].trim()
  }

  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }

  // 如果无法获取 IP，使用一个默认标识符
  // 这种情况下速率限制将对所有请求生效
  return "unknown-client"
}

// 预定义的速率限制配置
export const RATE_LIMITS = {
  // 一般 API 请求：每分钟 60 次
  API_DEFAULT: { limit: 60, windowMs: 60 * 1000 },
  // 敏感操作（如登录）：每分钟 10 次
  SENSITIVE: { limit: 10, windowMs: 60 * 1000 },
  // 订阅类请求：每小时 5 次
  NEWSLETTER: { limit: 5, windowMs: 60 * 60 * 1000 },
} as const
