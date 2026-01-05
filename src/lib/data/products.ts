"use server"

import { sdk } from "@lib/config"
import { getCacheConfig } from "@lib/config/cache"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { unstable_cache } from "next/cache"
import { getAuthHeaders, getCacheOptions, getRegionCountryCode } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"

// 用于列表视图的精简字段（只包含必要的显示信息）
// 包含：价格计算、库存信息、变体选项、变体图片、产品选项
const LIST_VIEW_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*variants.options.option_id,*variants.options.value,*variants.images.id,*variants.images.url,*options.id,*options.title,*options.values.id,*options.values.value"

// 完整字段（用于需要详细信息的场景）
const FULL_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*variants.inventory_items.inventory_item_id,*variants.inventory_items.required_quantity,*variants.images.id,*variants.images.url,*variants.images.metadata,*variants.options.option_id,*variants.options.value,*options.id,*options.title,*options.values.id,*options.values.value,+metadata,+tags,"

/**
 * 判断产品是否缺货
 */
function isProductOutOfStock(product: HttpTypes.StoreProduct): boolean {
  if (!product.variants || product.variants.length === 0) {
    return false
  }

  const hasInStockVariant = product.variants.some((variant) => {
    if (variant.manage_inventory === false) return true
    if (variant.allow_backorder === true) return true
    return (variant.inventory_quantity || 0) > 0
  })

  return !hasInStockVariant
}

/**
 * 获取产品的最低价格
 */
function getMinPrice(product: HttpTypes.StoreProduct): number {
  if (!product.variants || product.variants.length === 0) {
    return Infinity
  }
  return Math.min(
    ...product.variants.map(
      (variant) => variant?.calculated_price?.calculated_amount || 0
    )
  )
}

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
  useListViewFields = false,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
  countryCode?: string
  regionId?: string
  useListViewFields?: boolean
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
}> => {
  // If no countryCode or regionId provided, get from cookie
  if (!countryCode && !regionId) {
    countryCode = await getRegionCountryCode()
  }

  const limit = queryParams?.limit || 12
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

  const next = {
    ...(await getCacheOptions("products")),
  }

  const cacheConfig = getCacheConfig("PRODUCT_LIST")

  // 根据使用场景选择字段
  const defaultFields = useListViewFields ? LIST_VIEW_FIELDS : FULL_FIELDS

  // If custom fields are provided, merge them with default fields using + prefix
  const fields = queryParams?.fields
    ? queryParams.fields.startsWith("+") || queryParams.fields.startsWith("-")
      ? `${defaultFields}${queryParams.fields}`
      : `${defaultFields}+${queryParams.fields}`
    : defaultFields

  // Remove fields from queryParams to avoid duplication
  const { fields: _, ...restQueryParams } = queryParams || {}

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      `/store/products`,
      {
        method: "GET",
        query: {
          limit,
          offset,
          region_id: region?.id,
          fields,
          ...restQueryParams,
        },
        headers,
        next,
        ...cacheConfig,
      }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
}

/**
 * 获取价格排序的产品 ID 列表（使用缓存）
 * 缓存 60 秒以避免频繁请求所有产品
 */
const getPriceSortedProductIds = async (
  countryCode: string,
  sortBy: "price_asc" | "price_desc",
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
): Promise<{ sortedIds: string[]; totalCount: number }> => {
  // 创建缓存 key
  const cacheKey = `price-sorted-${countryCode}-${sortBy}-${JSON.stringify(queryParams || {})}`
  
  // 使用 unstable_cache 缓存排序结果
  const getCachedSortedIds = unstable_cache(
    async () => {
      // 获取所有产品的 ID 和价格信息（使用精简字段）
      const allProducts: HttpTypes.StoreProduct[] = []
      let offset = 0
      const batchSize = 100
      let totalCount = 0

      // 分批获取所有产品
      while (true) {
        const { response } = await listProducts({
          pageParam: 1,
          queryParams: {
            ...queryParams,
            limit: batchSize,
            offset,
          } as any,
          countryCode,
          useListViewFields: true,
        })

        allProducts.push(...response.products)
        totalCount = response.count

        if (allProducts.length >= totalCount || response.products.length < batchSize) {
          break
        }

        offset += batchSize
      }

      // 计算每个产品的价格和库存状态
      const productsWithMeta = allProducts.map((product) => ({
        id: product.id,
        minPrice: getMinPrice(product),
        outOfStock: isProductOutOfStock(product),
      }))

      // 排序：有货的在前，缺货的在后；同类按价格排序
      productsWithMeta.sort((a, b) => {
        // 先按库存状态排序
        if (a.outOfStock !== b.outOfStock) {
          return a.outOfStock ? 1 : -1
        }
        // 再按价格排序
        const diff = a.minPrice - b.minPrice
        return sortBy === "price_asc" ? diff : -diff
      })

      return {
        sortedIds: productsWithMeta.map((p) => p.id),
        totalCount,
      }
    },
    [cacheKey],
    {
      revalidate: 60, // 缓存 60 秒
      tags: ["products", "price-sort"],
    }
  )

  return getCachedSortedIds()
}

/**
 * 使用服务端分页获取产品列表并排序
 * 
 * 优化策略：
 * - created_at 排序：直接使用 API 的 order 参数和 offset/limit 分页
 * - price 排序：使用缓存的排序 ID 列表，只获取当前页的产品
 */
export const listProductsWithSort = async ({
  page = 1,
  queryParams,
  sortBy = "created_at",
  countryCode,
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  countryCode?: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  const limit = queryParams?.limit || 12
  const resolvedCountryCode = countryCode || (await getRegionCountryCode())

  // 对于 created_at 排序，使用真正的服务端分页
  if (sortBy === "created_at") {
    const { response, nextPage } = await listProducts({
      pageParam: page,
      queryParams: {
        ...queryParams,
        limit,
        order: "-created_at", // 按创建时间降序
      },
      countryCode: resolvedCountryCode,
      useListViewFields: true,
    })

    // 将缺货产品移到后面（只在当前页内排序）
    const sortedProducts = [...response.products].sort((a, b) => {
      const aOutOfStock = isProductOutOfStock(a)
      const bOutOfStock = isProductOutOfStock(b)
      if (aOutOfStock === bOutOfStock) return 0
      return aOutOfStock ? 1 : -1
    })

    return {
      response: {
        products: sortedProducts,
        count: response.count,
      },
      nextPage: nextPage ? page + 1 : null,
      queryParams,
    }
  }

  // 对于价格排序，使用缓存的排序 ID 列表
  if (sortBy === "price_asc" || sortBy === "price_desc") {
    const { sortedIds, totalCount } = await getPriceSortedProductIds(
      resolvedCountryCode,
      sortBy,
      queryParams
    )

    // 计算当前页需要的产品 ID
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const pageIds = sortedIds.slice(startIndex, endIndex)

    if (pageIds.length === 0) {
      return {
        response: { products: [], count: totalCount },
        nextPage: null,
        queryParams,
      }
    }

    // 只获取当前页的产品详情
    const { response } = await listProducts({
      pageParam: 1,
      queryParams: {
        ...queryParams,
        id: pageIds,
        limit: pageIds.length,
      },
      countryCode: resolvedCountryCode,
      useListViewFields: true,
    })

    // 按照排序后的 ID 顺序重新排列产品
    const productMap = new Map(response.products.map((p) => [p.id, p]))
    const orderedProducts = pageIds
      .map((id) => productMap.get(id))
      .filter((p): p is HttpTypes.StoreProduct => p !== undefined)

    const hasNextPage = endIndex < totalCount

    return {
      response: {
        products: orderedProducts,
        count: totalCount,
      },
      nextPage: hasNextPage ? page + 1 : null,
      queryParams,
    }
  }

  // 默认情况，回退到原始逻辑
  return listProducts({
    pageParam: page,
    queryParams: {
      ...queryParams,
      limit,
    },
    countryCode: resolvedCountryCode,
    useListViewFields: true,
  })
}
