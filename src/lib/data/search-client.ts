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

    console.log("[SearchProductsClient] Search API returned:", {
      productIdsCount: productIds?.length || 0,
      count,
      firstFewIds: productIds?.slice(0, 3),
    })

    if (!productIds || productIds.length === 0) {
      return { products: [], count: count || 0 }
    }

    // 2. 使用 sdk.client.fetch 直接调用 /store/products API
    // SDK 会自动处理数组参数的序列化（id[0]=xxx&id[1]=yyy 格式）
    console.log("[SearchProductsClient] Fetching products with IDs:", productIds.slice(0, 3))

    const productsResponse = await sdk.client.fetch<{
      products: HttpTypes.StoreProduct[]
      count: number
    }>(`/store/products`, {
      method: "GET",
      query: {
        id: productIds, // 直接传递数组，SDK 会处理序列化
        limit: productIds.length,
        region_id: regionId,
        fields: '*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*variants.inventory_items.inventory_item_id,*variants.inventory_items.required_quantity,*variants.images.id,*variants.images.url,*variants.images.metadata,*variants.options.option_id,*variants.options.value,*options.id,*options.title,*options.values.id,*options.values.value,+metadata,+tags,',
      },
      cache: "no-store",
    })

    console.log("[SearchProductsClient] Products API response:", {
      productsCount: productsResponse.products?.length || 0,
      count: productsResponse.count,
      productIds: productsResponse.products?.map(p => p.id) || [],
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

