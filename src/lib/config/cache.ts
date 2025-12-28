const isDevelopment = process.env.NODE_ENV === 'development'

// 开发环境禁用所有缓存
const DEV_CACHE_CONFIG = { cache: "no-store" as const }

export const CACHE_STRATEGIES = {
  // 用户特定数据 - 不缓存或短期缓存
  USER_SPECIFIC: isDevelopment ? DEV_CACHE_CONFIG : { cache: "no-store" as const },
  CART: isDevelopment ? DEV_CACHE_CONFIG : { cache: "no-store" as const },
  ORDER: isDevelopment ? DEV_CACHE_CONFIG : { cache: "no-store" as const },
  CUSTOMER: isDevelopment ? DEV_CACHE_CONFIG : { cache: "no-store" as const },
  
  // 公共数据 - ISR
  // 注意：产品数据包含价格和库存，需要实时更新，不使用缓存
  PRODUCT_LIST: DEV_CACHE_CONFIG, // 包含价格和库存，需要实时
  PRODUCT_DETAIL: DEV_CACHE_CONFIG, // 包含价格和库存，需要实时
  CATEGORY: isDevelopment ? DEV_CACHE_CONFIG : { cache: "force-cache" as const, revalidate: 7200 },
  COLLECTION: isDevelopment ? DEV_CACHE_CONFIG : { cache: "force-cache" as const, revalidate: 7200 },
  REGION: isDevelopment ? DEV_CACHE_CONFIG : { cache: "force-cache" as const, revalidate: 3600 },
  BLOG: isDevelopment ? DEV_CACHE_CONFIG : { cache: "force-cache" as const, revalidate: 300 }, // Blog 缓存 5 分钟，确保内容及时更新
  
  // 半动态数据
  VARIANT: DEV_CACHE_CONFIG, // 包含价格和库存，需要实时
  FULFILLMENT: isDevelopment ? DEV_CACHE_CONFIG : { cache: "force-cache" as const, revalidate: 600 },
  PAYMENT_PROVIDER: isDevelopment ? DEV_CACHE_CONFIG : { cache: "force-cache" as const, revalidate: 3600 }, // 支付选项相对稳定，1小时缓存
} as const

// 辅助函数：根据环境返回缓存配置
export function getCacheConfig(strategy: keyof typeof CACHE_STRATEGIES) {
  return CACHE_STRATEGIES[strategy]
}

