"use server"

import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getRegion, retrieveRegion } from "./regions"
import { listProducts } from "./products"

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

  // 直接使用 listProducts，传入 q 参数进行搜索
  const { response } = await listProducts({
    pageParam: _pageParam,
    queryParams: {
      q: searchTerm.trim(),
      limit,
      order,
    },
    countryCode,
    regionId,
    useListViewFields: true,
  })

  const nextPage = response.count > offset + limit ? pageParam + 1 : null

  return {
    response,
    nextPage,
  }
}
