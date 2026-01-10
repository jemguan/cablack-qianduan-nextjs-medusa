"use client"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

export const searchProductsClient = async ({
  searchTerm,
  countryCode,
  regionId,
  limit = 5,
}: {
  searchTerm: string
  countryCode?: string
  regionId?: string
  limit?: number
}): Promise<{
  products: HttpTypes.StoreProduct[]
  count: number
}> => {
  if (!searchTerm || searchTerm.trim() === "") {
    return { products: [], count: 0 }
  }

  try {
    // 使用自定义的模糊搜索 API（不区分大小写）
    const response = await sdk.client.fetch<{
      products: HttpTypes.StoreProduct[]
      count: number
    }>(`/store/products/search`, {
      method: "GET",
      query: {
        q: searchTerm.trim(),
        limit,
        region_id: regionId,
      },
    })

    return {
      products: response.products || [],
      count: response.count || 0,
    }
  } catch (error) {
    console.error("Search products error:", error)
    return { products: [], count: 0 }
  }
}

