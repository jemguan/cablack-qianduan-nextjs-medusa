"use server"

import { sdk } from "@lib/config"
import { getCacheConfig } from "@lib/config/cache"
import { getCacheOptions } from "./cookies"

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
  // 获取缓存标签
  const cacheOptions = await getCacheOptions("brands")
  
  // 获取缓存策略
  const cacheConfig = getCacheConfig("BRAND")

  // 合并 tags 和 revalidate 到 next 对象
  const next = {
    ...cacheOptions,
    ...(cacheConfig && 'next' in cacheConfig ? cacheConfig.next : {}),
  }

  queryParams.limit = queryParams.limit || "100"
  queryParams.offset = queryParams.offset || "0"

  return sdk.client
    .fetch<{ brands: Brand[]; count: number }>(
      "/store/brands",
      {
        query: queryParams,
        next,
      }
    )
    .then(({ brands, count }) => ({ brands, count }))
}

export const getBrandBySlug = async (
  slugOrId: string
): Promise<(Brand & { products?: any[] }) | null> => {
  if (!slugOrId) {
    return null
  }

  // 获取缓存标签
  const cacheOptions = await getCacheOptions("brands")
  
  // 获取缓存策略
  const cacheConfig = getCacheConfig("BRAND")

  // 合并 tags 和 revalidate 到 next 对象
  const next = {
    ...cacheOptions,
    ...(cacheConfig && 'next' in cacheConfig ? cacheConfig.next : {}),
  }

  // 合并缓存配置
  const fetchOptions: any = {
    next,
  }

  // 如果缓存配置有 cache 属性，也需要合并
  if (cacheConfig && 'cache' in cacheConfig) {
    fetchOptions.cache = cacheConfig.cache
  }

  try {
    // 编码 slug 以确保 URL 安全
    const encodedSlug = encodeURIComponent(slugOrId)
    
    const response = await sdk.client.fetch<{ brand: Brand & { products?: any[] } }>(
      `/store/brands/${encodedSlug}`,
      fetchOptions
    )
    
    if (!response || !response.brand) {
      return null
    }
    
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
