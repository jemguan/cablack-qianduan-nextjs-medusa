"use server"

import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getRegion, retrieveRegion } from "./regions"
import { listProducts } from "./products"
import { sortProducts } from "@lib/util/sort-products"

/**
 * 搜索产品
 * 
 * 直接使用 Medusa 标准的 /store/products API 的 q 参数进行搜索
 * Medusa 会自动处理销售渠道、区域、价格等过滤
 */
export const searchProducts = async ({
  searchTerm,
  pageParam = 1,
  countryCode,
  regionId,
  limit = 12,
  sortBy = "created_at",
}: {
  searchTerm: string
  pageParam?: number
  countryCode?: string
  regionId?: string
  limit?: number
  sortBy?: SortOptions
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
}> => {
  if (!searchTerm || searchTerm.trim() === "") {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    region = await getRegion(countryCode)
  } else {
    region = await retrieveRegion(regionId!)
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  // 将 sortBy 转换为 Medusa 的 order 参数格式
  let order: string
  switch (sortBy) {
    case "price_asc":
      order = "variants.calculated_price.calculated_amount"
      break
    case "price_desc":
      order = "-variants.calculated_price.calculated_amount"
      break
    case "created_at":
    default:
      order = "-created_at"
      break
  }

  // 使用 q 参数搜索（Medusa 默认搜索标题和描述）
  // 注意：Medusa Store API 的 q 参数搜索产品的 searchable properties（标题和描述）
  // SKU、标签、变体选项等需要通过自定义 API 或后端搜索实现
  const trimmedSearchTerm = searchTerm.trim()
  
  try {
    // 先获取所有搜索结果（不分页），以便应用排序逻辑
    // 获取足够多的产品以确保排序准确性
    const searchLimit = Math.max(limit * 10, 100) // 获取至少 10 页或 100 个产品
    
    const { response: allResults } = await listProducts({
      pageParam: 1,
      queryParams: {
        q: trimmedSearchTerm, // 搜索标题和描述
        limit: searchLimit,
        order, // 先按基础排序获取
      },
      countryCode: regionId ? undefined : countryCode,
      regionId: regionId || region?.id,
      useListViewFields: true,
      noCache: true, // 搜索时禁用缓存
    })

    // 应用与产品列表相同的排序逻辑（包括缺货产品排在最后）
    const sortedProducts = sortProducts(allResults.products, sortBy)

    // 应用分页
    const startIndex = offset
    const endIndex = offset + limit
    const paginatedProducts = sortedProducts.slice(startIndex, endIndex)

    const nextPage = sortedProducts.length > endIndex ? pageParam + 1 : null

    return {
      response: {
        products: paginatedProducts,
        count: sortedProducts.length, // 使用排序后的总数
      },
      nextPage,
    }
  } catch (error: any) {
    console.error("[searchProducts] Search error:", {
      error: error?.message || error,
      searchTerm: trimmedSearchTerm,
      regionId: regionId || region?.id,
      countryCode,
    })
    
    // 返回空结果而不是抛出错误，避免页面崩溃
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }
}
