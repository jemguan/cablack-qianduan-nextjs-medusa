"use server"

import { sdk } from "@lib/config"
import { getCacheConfig } from "@lib/config/cache"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { unstable_cache } from "next/cache"
import { getAuthHeaders, getCacheOptions, getCacheTag, getRegionCountryCode } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"

// 用于排序的超精简字段（只包含排序所需的最小字段）
// 包含：ID、创建时间、价格计算、库存信息
const SORT_ONLY_FIELDS =
  "id,created_at,*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder"

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
  noCache = false,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
  countryCode?: string
  regionId?: string
  useListViewFields?: boolean
  noCache?: boolean
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

  const cacheOptions = await getCacheOptions("products")
  const productsInventoryTag = await getCacheTag("products-inventory")
  
  // 添加产品库存相关的缓存标签，以便在库存变化时失效缓存
  const existingTags = (cacheOptions as { tags?: string[] })?.tags || []
  const next = {
    ...cacheOptions,
    ...(productsInventoryTag ? {
      tags: [...existingTags, productsInventoryTag].filter(Boolean)
    } : {}),
  }

  // 如果 noCache 为 true，禁用缓存（用于搜索等动态查询）
  const cacheConfig = noCache 
    ? { cache: "no-store" as const }
    : getCacheConfig("PRODUCT_LIST")

  // 根据使用场景选择字段
  // 如果 queryParams.fields 以 "=" 开头，表示完全替换默认字段
  const shouldReplaceFields = queryParams?.fields?.startsWith("=")
  const fieldsToUse = shouldReplaceFields 
    ? queryParams.fields.substring(1) // 移除 "=" 前缀
    : undefined
  
  const defaultFields = useListViewFields ? LIST_VIEW_FIELDS : FULL_FIELDS

  // If custom fields are provided, merge them with default fields using + prefix
  // 如果 fieldsToUse 存在，完全替换；否则按原逻辑合并
  const fields = fieldsToUse
    ? fieldsToUse
    : queryParams?.fields
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
 * 获取所有产品并按指定规则排序（使用缓存）
 * 缓存 5 分钟（300秒）以显著提升性能，减少对700+产品的频繁查询
 * 
 * 优化策略：
 * - 使用超精简字段集（SORT_ONLY_FIELDS）减少数据传输量
 * - 增加批量大小到200，减少请求次数
 * - 延长缓存时间到5分钟，平衡实时性和性能
 * 
 * 所有排序都会将缺货产品放到最后
 */
const getSortedProductIds = async (
  countryCode: string,
  sortBy: SortOptions,
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
): Promise<{ sortedIds: string[]; totalCount: number }> => {
  // 创建稳定的缓存 key（排序 queryParams 确保一致性）
  const normalizedQueryParams = queryParams 
    ? Object.keys(queryParams)
        .sort()
        .reduce((acc, key) => {
          const value = queryParams[key as keyof typeof queryParams]
          if (value !== undefined && value !== null) {
            acc[key] = Array.isArray(value) ? [...value].sort() : value
          }
          return acc
        }, {} as Record<string, any>)
    : {}
  
  const cacheKey = `sorted-${countryCode}-${sortBy}-${JSON.stringify(normalizedQueryParams)}`
  
  // 获取产品库存缓存标签
  const productsInventoryTag = await getCacheTag("products-inventory")
  
  // 使用 unstable_cache 缓存排序结果
  const getCachedSortedIds = unstable_cache(
    async () => {
      const startTime = Date.now()
      
      // 获取所有产品的 ID 和排序信息（使用超精简字段）
      const allProducts: HttpTypes.StoreProduct[] = []
      let offset = 0
      const batchSize = 200 // 增加批量大小，减少请求次数
      let totalCount = 0

      // 分批获取所有产品
      while (true) {
        const { response } = await listProducts({
          pageParam: 1,
          queryParams: {
            ...queryParams,
            limit: batchSize,
            offset,
            fields: `=${SORT_ONLY_FIELDS}`, // 使用 "=" 前缀完全替换默认字段，使用超精简字段集
          } as any,
          countryCode,
          useListViewFields: false, // 不使用 LIST_VIEW_FIELDS，使用自定义字段
        })

        allProducts.push(...response.products)
        totalCount = response.count

        if (allProducts.length >= totalCount || response.products.length < batchSize) {
          break
        }

        offset += batchSize
      }

      // 计算每个产品的排序信息
      const productsWithMeta = allProducts.map((product) => ({
        id: product.id,
        minPrice: getMinPrice(product),
        createdAt: product.created_at ? new Date(product.created_at).getTime() : 0,
        outOfStock: isProductOutOfStock(product),
      }))

      // 排序逻辑：先按库存状态（有货在前），再按指定排序方式
      productsWithMeta.sort((a, b) => {
        // 先按库存状态排序：有货的在前，缺货的在后
        if (a.outOfStock !== b.outOfStock) {
          return a.outOfStock ? 1 : -1
        }
        
        // 再按指定排序方式
        if (sortBy === "price_asc") {
          return a.minPrice - b.minPrice
        } else if (sortBy === "price_desc") {
          return b.minPrice - a.minPrice
        } else {
          // created_at: 按创建时间降序（最新的在前）
          return b.createdAt - a.createdAt
        }
      })

      const duration = Date.now() - startTime
      if (process.env.NODE_ENV === "development") {
        console.log(`[Product Sort] Fetched ${totalCount} products in ${duration}ms`)
      }

      return {
        sortedIds: productsWithMeta.map((p) => p.id),
        totalCount,
      }
    },
    [cacheKey],
    {
      revalidate: 300, // 缓存 5 分钟（300秒），显著提升性能
      tags: ["products", "sort", `products-sort-${countryCode}`, productsInventoryTag].filter(Boolean),
    }
  )

  return getCachedSortedIds()
}

/**
 * 使用服务端分页获取产品列表并排序
 * 
 * 优化策略：
 * - 使用缓存的排序 ID 列表，确保缺货产品全局排在最后
 * - 分页时只获取当前页的产品详情
 * - 缓存 5 分钟（300秒），显著提升性能，减少对700+产品的频繁查询
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

  // 使用统一的缓存排序逻辑，确保缺货产品全局排在最后
  const { sortedIds, totalCount } = await getSortedProductIds(
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
