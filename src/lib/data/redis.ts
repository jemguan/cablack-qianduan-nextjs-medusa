import Redis from "ioredis"

// Redis 客户端（仅在有 REDIS_URL 时初始化）
let redis: Redis | null = null
let isRedisAvailable = false
let connectionAttempted = false

// 初始化 Redis 连接
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        // 最多重试 3 次，每次间隔递增
        if (times > 3) {
          console.warn("[Redis] Max retries reached, giving up")
          return null // 停止重试
        }
        return Math.min(times * 200, 1000) // 200ms, 400ms, 600ms
      },
      connectTimeout: 5000, // 连接超时 5 秒
      commandTimeout: 3000, // 命令超时 3 秒
      lazyConnect: true,
      enableOfflineQueue: false, // 离线时不排队命令，直接失败
    })

    redis.on("connect", () => {
      isRedisAvailable = true
      console.log("[Redis] Connected successfully")
    })

    redis.on("ready", () => {
      isRedisAvailable = true
    })

    redis.on("error", (err) => {
      // 只在状态变化时打印，避免日志刷屏
      if (isRedisAvailable) {
        console.warn("[Redis] Connection error:", err.message)
      }
      isRedisAvailable = false
    })

    redis.on("close", () => {
      isRedisAvailable = false
    })

    redis.on("reconnecting", () => {
      console.log("[Redis] Reconnecting...")
    })

    // 尝试连接（非阻塞）
    redis
      .connect()
      .then(() => {
        connectionAttempted = true
      })
      .catch((err) => {
        console.warn("[Redis] Failed to connect:", err.message)
        isRedisAvailable = false
        connectionAttempted = true
      })
  } catch (err) {
    console.warn("[Redis] Failed to initialize:", err)
    redis = null
    isRedisAvailable = false
    connectionAttempted = true
  }
} else {
  console.log("[Redis] REDIS_URL not set, running without Redis cache")
  connectionAttempted = true
}

// 缓存 TTL 常量（秒）
export const CACHE_TTL = {
  SHORT: 60, // 1分钟
  MEDIUM: 300, // 5分钟
  LONG: 3600, // 1小时
  VERY_LONG: 7200, // 2小时
  EXTRA_LONG: 14400, // 4小时
} as const

// 缓存 Key 前缀
// 注意：只缓存小数据（分类、区域、品牌），产品列表用 Next.js ISR
export const CACHE_KEYS = {
  CATEGORY_LIST: "category:list",
  CATEGORY_HANDLE: "category:handle:",
  REGION_LIST: "region:list",
  REGION_MAP: "region:country_map",
  BRAND_LIST: "brand:list",
  BRAND_SLUG: "brand:slug:",
} as const

// 检查 Redis 是否可用
export function isRedisEnabled(): boolean {
  return isRedisAvailable && redis !== null && redis.status === "ready"
}

// 带超时的 Promise 包装
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T | null> {
  let timeoutId: NodeJS.Timeout
  const timeoutPromise = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => resolve(null), timeoutMs)
  })

  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timeoutId!)
    return result
  } catch {
    clearTimeout(timeoutId!)
    return null
  }
}

// 通用缓存读取（Redis 不可用时返回 null）
export async function getCache<T>(key: string): Promise<T | null> {
  if (!isRedisEnabled()) return null

  try {
    // 添加 2 秒超时保护
    const data = await withTimeout(redis!.get(key), 2000)
    if (data === null) return null
    return JSON.parse(data)
  } catch (err) {
    // 静默失败，降级到无缓存
    if (process.env.NODE_ENV === "development") {
      console.warn("[Redis] Get error:", err)
    }
    return null
  }
}

// 通用缓存写入（Redis 不可用时静默跳过）
export async function setCache(
  key: string,
  data: unknown,
  ttl: number
): Promise<void> {
  if (!isRedisEnabled()) return

  try {
    // 添加 2 秒超时保护，写入失败不影响业务
    await withTimeout(redis!.setex(key, ttl, JSON.stringify(data)), 2000)
  } catch (err) {
    // 静默失败
    if (process.env.NODE_ENV === "development") {
      console.warn("[Redis] Set error:", err)
    }
  }
}

// 删除单个缓存
export async function deleteCache(key: string): Promise<void> {
  if (!isRedisEnabled()) return

  try {
    await withTimeout(redis!.del(key), 2000)
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Redis] Delete error:", err)
    }
  }
}

// 删除匹配模式的缓存（用于批量失效）
export async function deleteCachePattern(pattern: string): Promise<void> {
  if (!isRedisEnabled()) return

  try {
    const keys = await withTimeout(redis!.keys(pattern), 2000)
    if (keys && keys.length > 0) {
      await withTimeout(redis!.del(...keys), 2000)
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Redis] Delete pattern error:", err)
    }
  }
}

// 清除所有区域相关缓存（用于用户切换区域时）
export async function invalidateRegionCache(): Promise<void> {
  await deleteCachePattern(`${CACHE_KEYS.REGION_MAP}:*`)
  await deleteCache(CACHE_KEYS.REGION_LIST)
}

// 清除所有缓存（谨慎使用）
export async function invalidateAllCache(): Promise<void> {
  if (!isRedisEnabled()) return

  try {
    await withTimeout(redis!.flushdb(), 5000)
    console.log("[Redis] All cache invalidated")
  } catch (err) {
    console.warn("[Redis] Failed to invalidate all cache:", err)
  }
}

export default redis
