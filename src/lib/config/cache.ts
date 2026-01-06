/**
 * Next.js Fetch 缓存策略配置
 *
 * 策略说明：
 * - 开发环境：禁用所有缓存，确保实时数据
 * - 生产环境：根据数据类型使用不同的缓存策略
 *
 * 缓存时间建议：
 * - 用户数据（购物车、订单、客户）：不缓存
 * - 产品列表：短期缓存（60秒），平衡实时性和性能
 * - 产品详情：短期缓存（60秒），包含价格库存但接受短暂延迟
 * - 分类/集合：中期缓存（2小时），相对稳定
 * - 品牌/区域：长期缓存（1小时），变化较少
 */

const isDevelopment = process.env.NODE_ENV === "development"

// 开发环境禁用所有缓存
const DEV_CACHE_CONFIG = { cache: "no-store" as const }

// 生产环境短期缓存（60秒）- 用于频繁变化的公共数据
const SHORT_CACHE_CONFIG = { next: { revalidate: 60 } }

// 生产环境中期缓存（5分钟）- 用于半动态数据
const MEDIUM_CACHE_CONFIG = { next: { revalidate: 300 } }

// 生产环境长期缓存（1小时）- 用于相对稳定的数据
const LONG_CACHE_CONFIG = { next: { revalidate: 3600 } }

// 生产环境超长缓存（2小时）- 用于很少变化的数据
const VERY_LONG_CACHE_CONFIG = { next: { revalidate: 7200 } }

export const CACHE_STRATEGIES = {
  // ==================== 用户特定数据 - 永不缓存 ====================
  USER_SPECIFIC: { cache: "no-store" as const },
  CART: { cache: "no-store" as const },
  ORDER: { cache: "no-store" as const },
  CUSTOMER: { cache: "no-store" as const },

  // ==================== 产品数据 - 短期缓存 ====================
  // 产品数据包含价格和库存，使用短期缓存（60秒）
  // 这样可以显著减少 API 请求，同时保持数据相对实时
  PRODUCT_LIST: isDevelopment ? DEV_CACHE_CONFIG : SHORT_CACHE_CONFIG,
  PRODUCT_DETAIL: isDevelopment ? DEV_CACHE_CONFIG : SHORT_CACHE_CONFIG,
  VARIANT: isDevelopment ? DEV_CACHE_CONFIG : SHORT_CACHE_CONFIG,
  BUNDLE: isDevelopment ? DEV_CACHE_CONFIG : SHORT_CACHE_CONFIG,

  // ==================== 公共数据 - ISR 缓存 ====================
  CATEGORY: isDevelopment ? DEV_CACHE_CONFIG : VERY_LONG_CACHE_CONFIG,
  COLLECTION: isDevelopment ? DEV_CACHE_CONFIG : VERY_LONG_CACHE_CONFIG,
  REGION: isDevelopment ? DEV_CACHE_CONFIG : LONG_CACHE_CONFIG,
  BRAND: isDevelopment ? DEV_CACHE_CONFIG : LONG_CACHE_CONFIG,
  BLOG: isDevelopment ? DEV_CACHE_CONFIG : MEDIUM_CACHE_CONFIG,

  // ==================== 半动态数据 ====================
  FULFILLMENT: isDevelopment ? DEV_CACHE_CONFIG : MEDIUM_CACHE_CONFIG,
  PAYMENT_PROVIDER: isDevelopment ? DEV_CACHE_CONFIG : LONG_CACHE_CONFIG,

  // ==================== 用户生成内容 ====================
  REVIEW: isDevelopment ? DEV_CACHE_CONFIG : SHORT_CACHE_CONFIG,

  // ==================== 静态数据 - 长期缓存 ====================
  ANNOUNCEMENT: isDevelopment ? DEV_CACHE_CONFIG : LONG_CACHE_CONFIG,
  STATIC: isDevelopment ? DEV_CACHE_CONFIG : VERY_LONG_CACHE_CONFIG,
} as const

// 缓存策略类型
export type CacheStrategy = keyof typeof CACHE_STRATEGIES

/**
 * 获取缓存配置
 * @param strategy - 缓存策略名称
 * @returns 对应的缓存配置对象
 */
export function getCacheConfig(strategy: CacheStrategy) {
  return CACHE_STRATEGIES[strategy]
}

/**
 * 创建带有自定义 revalidate 时间的缓存配置
 * @param seconds - revalidate 时间（秒）
 * @returns 缓存配置对象
 */
export function createCacheConfig(seconds: number) {
  if (isDevelopment) {
    return DEV_CACHE_CONFIG
  }
  return { next: { revalidate: seconds } }
}

/**
 * 判断是否应该使用缓存
 * @param strategy - 缓存策略名称
 * @returns 是否使用缓存
 */
export function shouldCache(strategy: CacheStrategy): boolean {
  if (isDevelopment) {
    return false
  }

  const noCacheStrategies: CacheStrategy[] = [
    "USER_SPECIFIC",
    "CART",
    "ORDER",
    "CUSTOMER",
  ]

  return !noCacheStrategies.includes(strategy)
}

export default CACHE_STRATEGIES
