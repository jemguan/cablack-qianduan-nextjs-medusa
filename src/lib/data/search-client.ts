"use client"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

/**
 * 客户端搜索产品
 * 直接使用 Medusa 标准的 /store/products API 的 q 参数进行搜索
 */
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

  if (!regionId) {
    console.error("[SearchProductsClient] regionId is required")
    return { products: [], count: 0 }
  }

  try {
    // 直接使用 Medusa 标准的 /store/products API，带 q 参数进行搜索
    const response = await sdk.client.fetch<{
      products: HttpTypes.StoreProduct[]
      count: number
    }>(`/store/products`, {
      method: "GET",
      query: {
        q: searchTerm.trim(),
        limit,
        offset: 0,
        region_id: regionId,
        order: "-created_at", // 按创建时间降序排列
        fields: '*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*variants.images.id,*variants.images.url,*variants.images.metadata,*variants.options.option_id,*variants.options.value,*options.id,*options.title,*options.values.id,*options.values.value,+metadata,+tags,',
      },
      cache: "no-store",
    })

    return {
      products: response.products || [],
      count: response.count || 0,
    }
  } catch (error) {
    console.error("[SearchProductsClient] Search products error:", error)
    return { products: [], count: 0 }
  }
}
