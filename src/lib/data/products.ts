"use server"

import { sdk } from "@lib/config"
import { getCacheConfig } from "@lib/config/cache"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getAuthHeaders, getCacheOptions, getRegionCountryCode } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
  countryCode?: string
  regionId?: string
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

  // Default fields that should always be included
  const defaultFields =
    "*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*variants.inventory_items.inventory_item_id,*variants.inventory_items.required_quantity,*variants.images.id,*variants.images.url,*variants.images.metadata,*variants.options.option_id,*variants.options.value,*options.id,*options.title,*options.values.id,*options.values.value,+metadata,+tags,"

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
 * This will fetch products and sort them based on the sortBy parameter.
 * For the first page (page === 1), it fetches 36 products if total count > 36, otherwise fetches required products.
 * This provides a better initial experience while maintaining good LCP performance.
 * For subsequent pages, it fetches up to 1000 products for better pagination experience.
 * Note: Products are sorted client-side to support complex sorting logic (price, out-of-stock handling).
 */
export const listProductsWithSort = async ({
  page = 0,
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
  const MAX_PRODUCTS_TO_FETCH = 1000
  const INITIAL_FETCH_LIMIT = 36 // 首屏获取36个产品
  const isFirstPage = page === 1

  // If no countryCode provided, get from cookie
  const resolvedCountryCode = countryCode || await getRegionCountryCode()

  // For first page, fetch 36 products if total count > 36, otherwise fetch required products
  // This provides better initial experience while maintaining good LCP
  // For subsequent pages, fetch more products for better pagination experience
  const fetchLimit = isFirstPage ? INITIAL_FETCH_LIMIT : MAX_PRODUCTS_TO_FETCH

  const {
    response: { products, count },
  } = await listProducts({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      limit: fetchLimit,
    },
    countryCode: resolvedCountryCode,
  })

  const sortedProducts = sortProducts(products, sortBy)

  // For first page, use the API's total count for pagination calculation
  // For subsequent pages, use the effective count to prevent empty pagination dots
  const actualCount = sortedProducts.length
  const effectiveCount = isFirstPage 
    ? count // Use API's total count for first page to show correct pagination
    : Math.min(count, actualCount) // For other pages, limit to fetched products

  const pageParam = (page - 1) * limit

  const nextPage = effectiveCount > pageParam + limit ? pageParam + limit : null

  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)

  return {
    response: {
      products: paginatedProducts,
      count: effectiveCount,
    },
    nextPage,
    queryParams,
  }
}
