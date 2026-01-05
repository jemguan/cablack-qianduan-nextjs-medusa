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

// 内存存储
const rateLimitStore = new Map<string, RateLimitEntry>()

// 定期清理过期条目（每分钟）
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key)
      }
    }
  }, 60 * 1000)
}

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

