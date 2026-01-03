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
  try {
    const cacheOptions = await getCacheOptions("products")
    const cacheConfig = getCacheConfig("PRODUCT_DETAIL")

    const next = {
      ...cacheOptions,
      ...(cacheConfig && 'next' in cacheConfig ? cacheConfig.next : {}),
    }

    const response = await sdk.client.fetch<{
      html_description: string | null
    }>(
      `/store/products/${productId}/html-description`,
      {
        method: "GET",
        next,
        ...cacheConfig,
      }
    )

    return response.html_description || null
  } catch (error) {
    console.error("Error fetching product HTML description:", error)
    return null
  }
}

