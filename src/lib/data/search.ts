"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getAuthHeaders } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"
import { listProducts } from "./products"

/**
 * 搜索产品
 * 
 * 使用与产品列表相同的模式：
 * 1. 调用搜索 API 获取排序后的产品 ID 列表
 * 2. 调用 listProducts（Medusa /store/products API）获取完整产品信息
 * 
 * 这样可以保持产品数据格式一致（包括 calculated_price、inventory_quantity 等）
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

  const headers = {
    ...(await getAuthHeaders()),
  }

  // 1. 调用搜索 API 获取排序后的产品 ID 列表
  const searchResult = await sdk.client
    .fetch<{ productIds: string[]; count: number; sortBy: string }>(
      `/store/products/search`,
      {
        method: "GET",
        query: {
          q: searchTerm.trim(),
          limit,
          offset,
          sortBy,
          currency_code: region?.currency_code,
        },
        headers,
        cache: "no-store",
      }
    )
    .catch(() => {
      return { productIds: [], count: 0, sortBy: "created_at" }
    })

  const { productIds, count } = searchResult

  if (productIds.length === 0) {
    return {
      response: { products: [], count },
      nextPage: null,
    }
  }

  // 2. 使用 listProducts（Medusa /store/products API）获取完整产品信息
  // 这样可以获得 calculated_price、inventory_quantity 等完整数据
  const { response } = await listProducts({
    pageParam: 1,
    queryParams: {
      id: productIds,
      limit: productIds.length,
    },
    countryCode,
    regionId,
    useListViewFields: true,
  })

  // 3. 按照搜索 API 返回的 ID 顺序重新排列产品
  const productMap = new Map(response.products.map((p) => [p.id, p]))
  const orderedProducts = productIds
    .map((id) => productMap.get(id))
    .filter((p): p is HttpTypes.StoreProduct => p !== undefined)

  const nextPage = count > offset + limit ? pageParam + 1 : null

  return {
    response: {
      products: orderedProducts,
      count,
    },
    nextPage,
  }
}
