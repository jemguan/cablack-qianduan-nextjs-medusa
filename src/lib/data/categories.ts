import { sdk } from "@lib/config"
import { getCacheConfig } from "@lib/config/cache"
import { HttpTypes } from "@medusajs/types"
import { unstable_cache } from "next/cache"
import { cache } from "react"

/**
 * 内部获取分类列表
 */
async function fetchCategoriesInternal(
  fields: string,
  limit: number,
  extraQuery?: Record<string, any>
): Promise<HttpTypes.StoreProductCategory[]> {
  const cacheConfig = getCacheConfig("CATEGORY")

  return sdk.client
    .fetch<{ product_categories: HttpTypes.StoreProductCategory[] }>(
      "/store/product-categories",
      {
        query: {
          fields,
          limit,
          ...extraQuery,
        },
        ...cacheConfig,
      }
    )
    .then(({ product_categories }) => product_categories)
}

/**
 * 模块级别的 unstable_cache - 完整分类列表（带子分类和产品）
 */
const cachedFullCategories = unstable_cache(
  () => fetchCategoriesInternal(
    "*category_children, *products, *parent_category, *parent_category.parent_category",
    1000
  ),
  ["categories-full"],
  {
    revalidate: 7200, // 2小时
    tags: ["categories"],
  }
)

/**
 * 获取分类列表
 * 使用 React.cache 确保同一次渲染只请求一次
 */
export const listCategories = cache(async (query?: Record<string, any>) => {
  // 如果没有自定义查询，使用缓存的完整列表
  if (!query || Object.keys(query).length === 0) {
    return cachedFullCategories()
  }

  // 简单查询（只要基本字段）直接请求
  const limit = query?.limit || 100
  const fields = query?.fields || "*category_children, *products, *parent_category, *parent_category.parent_category"
  
  return fetchCategoriesInternal(fields, limit, query)
})

/**
 * 内部获取单个分类
 */
async function fetchCategoryByHandleInternal(
  handle: string
): Promise<HttpTypes.StoreProductCategory | undefined> {
  const cacheConfig = getCacheConfig("CATEGORY")

  return sdk.client
    .fetch<HttpTypes.StoreProductCategoryListResponse>(
      `/store/product-categories`,
      {
        query: {
          fields: "*category_children, *products",
          handle,
        },
        ...cacheConfig,
      }
    )
    .then(({ product_categories }) => product_categories[0])
}

/**
 * 根据 handle 获取分类
 * 优化：先从缓存的完整列表中查找，找不到再单独请求
 *
 * 注意：Medusa 中分类的 handle 是单独的（如 "anal-dildos-&-probes"），
 * 而不是完整路径（如 "prostate-massager/anal-dildos-&-probes"）。
 * URL 路径用于导航层级，但查询时使用最后一个 handle。
 */
export const getCategoryByHandle = cache(async (categoryHandle: string[]) => {
  // 使用最后一个 handle 来查找分类（子分类的 handle 不包含父分类路径）
  const handle = categoryHandle[categoryHandle.length - 1]

  // 先尝试从缓存的完整列表中查找
  try {
    const allCategories = await cachedFullCategories()
    const found = allCategories.find(cat => cat.handle === handle)
    if (found) {
      return found
    }
  } catch (e) {
    // 如果完整列表获取失败，继续单独请求
  }

  // 如果在完整列表中没找到，单独请求
  return fetchCategoryByHandleInternal(handle)
})
