"use server"

import { sdk } from "@lib/config"
import { getCacheConfig } from "@lib/config/cache"
import { getCacheOptions } from "./cookies"

/**
 * 获取产品的 HTML 描述
 */
export async function getProductHtmlDescription(
  productId: string
): Promise<string | null> {
  if (!productId) {
    return null
  }

  try {
    const cacheOptions = await getCacheOptions("products")
    const cacheConfig = getCacheConfig("PRODUCT_DETAIL")

    const next = {
      ...cacheOptions,
      ...(cacheConfig && 'next' in cacheConfig ? cacheConfig.next : {}),
    }

    // 合并缓存配置
    const fetchOptions: any = {
      method: "GET",
      next,
    }

    // 如果缓存配置有 cache 属性，也需要合并
    if (cacheConfig && 'cache' in cacheConfig) {
      fetchOptions.cache = cacheConfig.cache
    }

    // 编码 productId 以确保 URL 安全
    const encodedProductId = encodeURIComponent(productId)

    const response = await sdk.client.fetch<{
      html_description: string | null
    }>(
      `/store/products/${encodedProductId}/html-description`,
      fetchOptions
    )

    if (!response) {
      return null
    }

    return response.html_description || null
  } catch (error: any) {
    // 如果是 404 错误，静默处理（产品可能没有 HTML 描述）
    if (error?.status === 404) {
      return null
    }
    // 其他错误记录日志但不抛出异常
    console.error(`Error fetching product HTML description for product ${productId}:`, error)
    return null
  }
}

