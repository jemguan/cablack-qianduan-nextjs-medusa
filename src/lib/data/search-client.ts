"use client"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

/**
 * 处理搜索词：trim、去重、验证长度
 */
const processSearchTerm = (searchTerm: string): string | null => {
  if (!searchTerm) {
    return null
  }

  // Trim 并移除多余空格
  const trimmed = searchTerm.trim().replace(/\s+/g, " ")

  if (trimmed === "") {
    return null
  }

  // 验证长度（限制在 1-100 个字符）
  if (trimmed.length < 1) {
    return null
  }

  if (trimmed.length > 100) {
    console.warn("[SearchProductsClient] Search term too long, truncating to 100 characters")
    return trimmed.substring(0, 100).trim()
  }

  return trimmed
}

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
  error?: string
}> => {
  // 处理搜索词
  const processedTerm = processSearchTerm(searchTerm)
  if (!processedTerm) {
    return { products: [], count: 0 }
  }

  if (!regionId) {
    const errorMsg = "[SearchProductsClient] regionId is required"
    console.error(errorMsg)
    return { products: [], count: 0, error: errorMsg }
  }

  // 验证 limit 范围
  const safeLimit = Math.min(Math.max(1, limit || 5), 50)

  try {
    // 直接使用 Medusa 标准的 /store/products API，带 q 参数进行搜索
    const response = await sdk.client.fetch<{
      products: HttpTypes.StoreProduct[]
      count: number
    }>(`/store/products`, {
      method: "GET",
      query: {
        q: processedTerm,
        limit: safeLimit,
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
  } catch (error: any) {
    const errorMsg = error?.message || "搜索失败，请稍后重试"
    console.error("[SearchProductsClient] Search products error:", {
      error,
      searchTerm: processedTerm,
      regionId,
    })
    return { products: [], count: 0, error: errorMsg }
  }
}
