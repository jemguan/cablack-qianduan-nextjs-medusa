"use server"

import { sdk } from "@lib/config"
import { getCacheConfig } from "@lib/config/cache"
import { getCacheOptions } from "./cookies"
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from "./redis"

export type Brand = {
  id: string
  name: string
  slug?: string | null
  description?: string | null
  logo_url?: string | null
  website_url?: string | null
  meta_title?: string | null
  meta_description?: string | null
  created_at: string
  updated_at: string
}

export const listBrands = async (
  queryParams: Record<string, string> = {}
): Promise<{ brands: Brand[]; count: number }> => {
  // 生成缓存 key（基于查询参数）
  const cacheKey =
    Object.keys(queryParams).length === 0
      ? CACHE_KEYS.BRAND_LIST
      : `${CACHE_KEYS.BRAND_LIST}:${JSON.stringify(queryParams)}`

  // 1. 先尝试从 Redis 获取
  const cached = await getCache<{ brands: Brand[]; count: number }>(cacheKey)
  if (cached) {
    return cached
  }

  // 获取缓存标签
  const cacheOptions = await getCacheOptions("brands")

  // 获取缓存策略
  const cacheConfig = getCacheConfig("BRAND")

  // 合并 tags 和 revalidate 到 next 对象
  const next = {
    ...cacheOptions,
    ...(cacheConfig && "next" in cacheConfig ? cacheConfig.next : {}),
  }

  queryParams.limit = queryParams.limit || "100"
  queryParams.offset = queryParams.offset || "0"

  try {
    const response = await sdk.client.fetch<{ brands: Brand[]; count: number }>(
      "/store/brands",
      {
        query: queryParams,
        next,
      }
    )
    const result = { brands: response.brands || [], count: response.count || 0 }

    // 2. 写入 Redis（如果可用），使用较短 TTL 避免内存占用过大
    await setCache(cacheKey, result, CACHE_TTL.MEDIUM)

    return result
  } catch (error) {
    console.error("Error fetching brands:", error)
    return { brands: [], count: 0 }
  }
}

export const getBrandBySlug = async (
  slugOrId: string
): Promise<(Brand & { products?: any[] }) | null> => {
  if (!slugOrId) {
    return null
  }

  // 生成缓存 key
  const cacheKey = `${CACHE_KEYS.BRAND_SLUG}${slugOrId}`

  // 1. 先尝试从 Redis 获取
  const cached = await getCache<Brand & { products?: any[] }>(cacheKey)
  if (cached) {
    return cached
  }

  // 获取缓存标签
  const cacheOptions = await getCacheOptions("brands")

  // 获取缓存策略
  const cacheConfig = getCacheConfig("BRAND")

  // 合并 tags 和 revalidate 到 next 对象
  const next = {
    ...cacheOptions,
    ...(cacheConfig && "next" in cacheConfig ? cacheConfig.next : {}),
  }

  // 合并缓存配置
  const fetchOptions: any = {
    next,
  }

  // 如果缓存配置有 cache 属性，也需要合并
  if (cacheConfig && "cache" in cacheConfig) {
    fetchOptions.cache = cacheConfig.cache
  }

  try {
    // 编码 slug 以确保 URL 安全
    const encodedSlug = encodeURIComponent(slugOrId)

    const response = await sdk.client.fetch<{
      brand: Brand & { products?: any[] }
    }>(`/store/brands/${encodedSlug}`, fetchOptions)

    if (!response || !response.brand) {
      return null
    }

    // 2. 写入 Redis（如果可用），使用较短 TTL
    await setCache(cacheKey, response.brand, CACHE_TTL.MEDIUM)

    return response.brand
  } catch (error) {
    // 记录错误以便调试，但不抛出异常
    console.error(`Error fetching brand by slug "${slugOrId}":`, error)
    return null
  }
}

export const getProductBrand = async (
  productId: string
): Promise<Brand | null> => {
  // 获取缓存标签
  const cacheOptions = await getCacheOptions("brands")
  
  // 获取缓存策略
  const cacheConfig = getCacheConfig("BRAND")

  // 合并 tags 和 revalidate 到 next 对象
  const next = {
    ...cacheOptions,
    ...(cacheConfig && 'next' in cacheConfig ? cacheConfig.next : {}),
  }

  return sdk.client
    .fetch<{ brand: Brand | null }>(
      `/store/products/${productId}/brand`,
      {
        next,
      }
    )
    .then(({ brand }) => brand)
    .catch(() => null)
}
