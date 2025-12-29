"use server"

import { sdk } from "@lib/config"
import { getCacheConfig } from "@lib/config/cache"
import type { Bundle, BundlesByProductResponse } from "@lib/types/bundle"

/**
 * 根据产品 ID 获取该产品作为主产品的所有捆绑包
 * @param productId 产品 ID
 * @returns 捆绑包列表
 */
export async function getBundlesByProductId(
  productId: string
): Promise<Bundle[]> {
  try {
    const cacheConfig = getCacheConfig("BUNDLE")
    const response = await sdk.client.fetch<BundlesByProductResponse>(
      `/store/bundles/by-product/${productId}`,
      {
        method: "GET",
        ...cacheConfig,
      }
    )

    return response.bundles || []
  } catch (error) {
    console.error("Error fetching bundles by product:", error)
    return []
  }
}

/**
 * 获取所有激活的捆绑包
 * @param limit 限制数量
 * @param offset 偏移量
 * @returns 捆绑包列表
 */
export async function getActiveBundles(
  limit: number = 20,
  offset: number = 0
): Promise<{ bundles: Bundle[]; count: number }> {
  try {
    const cacheConfig = getCacheConfig("BUNDLE")
    const response = await sdk.client.fetch<{
      bundles: Bundle[]
      count: number
      limit: number
      offset: number
    }>(`/store/bundles`, {
      method: "GET",
      query: {
        limit,
        offset,
      },
      ...cacheConfig,
    })

    return {
      bundles: response.bundles || [],
      count: response.count || 0,
    }
  } catch (error) {
    console.error("Error fetching active bundles:", error)
    return { bundles: [], count: 0 }
  }
}

/**
 * 根据 slug 获取捆绑包详情
 * @param slug 捆绑包 slug
 * @returns 捆绑包详情
 */
export async function getBundleBySlug(slug: string): Promise<Bundle | null> {
  try {
    const cacheConfig = getCacheConfig("BUNDLE")
    const response = await sdk.client.fetch<{ bundle: Bundle }>(
      `/store/bundles/${slug}`,
      {
        method: "GET",
        ...cacheConfig,
      }
    )

    return response.bundle || null
  } catch (error) {
    console.error("Error fetching bundle by slug:", error)
    return null
  }
}
