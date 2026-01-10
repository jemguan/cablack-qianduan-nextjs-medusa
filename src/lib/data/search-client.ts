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

  if (!regionId) {
    console.error("[SearchProductsClient] regionId is required")
    return { products: [], count: 0 }
  }

  try {
    // 1. 调用搜索 API 获取排序后的产品 ID 列表
    const searchResult = await sdk.client.fetch<{
      productIds: string[]
      count: number
      sortBy: string
    }>(`/store/products/search`, {
      method: "GET",
      query: {
        q: searchTerm.trim(),
        limit,
        offset: 0,
        sortBy: "created_at",
      },
      cache: "no-store",
    })

    const { productIds, count } = searchResult

    if (!productIds || productIds.length === 0) {
      return { products: [], count: count || 0 }
    }

    // 2. 使用 /store/products API 获取完整产品信息
    const productsResponse = await sdk.client.fetch<{
      products: HttpTypes.StoreProduct[]
      count: number
    }>(`/store/products`, {
      method: "GET",
      query: {
        id: productIds,
        limit: productIds.length,
        region_id: regionId,
        fields: "*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*variants.inventory_items.inventory_item_id,*variants.inventory_items.required_quantity,*variants.images.id,*variants.images.url,*variants.images.metadata,*variants.options.option_id,*variants.options.value,*options.id,*options.title,*options.values.id,*options.values.value,+metadata,+tags,",
      },
      cache: "no-store",
    })

    const products = productsResponse.products || []

    // 3. 按照搜索 API 返回的 ID 顺序重新排列产品
    const productMap = new Map(products.map((p) => [p.id, p]))
    const orderedProducts = productIds
      .map((id) => productMap.get(id))
      .filter((p): p is HttpTypes.StoreProduct => p !== undefined)

    return {
      products: orderedProducts,
      count: count || 0,
    }
  } catch (error) {
    console.error("[SearchProductsClient] Search products error:", error)
    return { products: [], count: 0 }
  }
}

