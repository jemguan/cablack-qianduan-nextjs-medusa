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

    // 2. 使用 /api/medusa-proxy/products 代理路由获取完整产品信息
    // 使用 URLSearchParams 确保 id 参数格式正确（id=xxx&id=yyy 而不是 id[0]=xxx&id[1]=yyy）
    const params = new URLSearchParams()
    productIds.forEach((id) => params.append('id', id))
    params.append('limit', productIds.length.toString())
    params.append('region_id', regionId)
    params.append('fields', '*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*variants.inventory_items.inventory_item_id,*variants.inventory_items.required_quantity,*variants.images.id,*variants.images.url,*variants.images.metadata,*variants.options.option_id,*variants.options.value,*options.id,*options.title,*options.values.id,*options.values.value,+metadata,+tags,')

    const productsResponse = await fetch(`/api/medusa-proxy/products?${params.toString()}`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
      },
      cache: "no-store",
    }).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`)
      }
      return res.json()
    }) as {
      products: HttpTypes.StoreProduct[]
      count: number
    }

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

