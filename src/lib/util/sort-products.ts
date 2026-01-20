import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

interface SortableProduct extends HttpTypes.StoreProduct {
  _minPrice?: number
  _publishedAt?: number
}

/**
 * 判断产品是否缺货
 * @param product 产品对象
 * @returns true 表示缺货，false 表示有货
 */
function isProductOutOfStock(product: HttpTypes.StoreProduct): boolean {
  // 如果产品没有 variants，视为有货
  if (!product.variants || product.variants.length === 0) {
    return false
  }

  // 如果至少有一个 variant 有货，则产品有货
  // 根据 Medusa 文档：variant 有货的条件是：
  // - manage_inventory === false（不管理库存，始终有货）
  // - allow_backorder === true（允许缺货订购，视为有货）
  // - inventory_quantity > 0（库存数量大于 0）
  const hasInStockVariant = product.variants.some((variant) => {
    // 如果不管理库存，视为有货
    if (variant.manage_inventory === false) {
      return true
    }
    // 如果允许缺货订购，视为有货
    if (variant.allow_backorder === true) {
      return true
    }
    // 检查库存数量（null/undefined 视为缺货）
    return (variant.inventory_quantity || 0) > 0
  })

  // 如果没有任何 variant 有货，则产品缺货
  return !hasInStockVariant
}

/**
 * Helper function to sort products by price until the store API supports sorting by price
 * @param products
 * @param sortBy
 * @returns products sorted by price
 */
export function sortProducts(
  products: HttpTypes.StoreProduct[],
  sortBy: SortOptions
): HttpTypes.StoreProduct[] {
  let sortedProducts = products as SortableProduct[]

  // 预计算排序所需的信息
  sortedProducts.forEach((product) => {
    // 计算最低价格
    if (product.variants && product.variants.length > 0) {
      product._minPrice = Math.min(
        ...product.variants.map(
          (variant) => variant?.calculated_price?.calculated_amount || 0
        )
      )
    } else {
      product._minPrice = Infinity
    }

    // 获取发布时间（存储在 metadata.published_at）
    const metadata = product.metadata as Record<string, unknown> | null
    const publishedAtStr = metadata?.published_at as string | undefined
    product._publishedAt = publishedAtStr ? new Date(publishedAtStr).getTime() : 0
  })

  // 排序逻辑：
  // 1. 有库存的产品排在前面
  // 2. 缺货的产品排在后面
  // 3. 在各自分组内按用户选择的排序方式排序
  sortedProducts.sort((a, b) => {
    const aOutOfStock = isProductOutOfStock(a)
    const bOutOfStock = isProductOutOfStock(b)

    // 有库存的排在缺货的前面
    if (aOutOfStock !== bOutOfStock) {
      return aOutOfStock ? 1 : -1
    }

    // 按用户选择的排序方式
    if (sortBy === "published_at") {
      // 发布日期：按发布时间降序（最新发布的在前）
      return (b._publishedAt || 0) - (a._publishedAt || 0)
    } else if (sortBy === "price_asc") {
      return (a._minPrice || 0) - (b._minPrice || 0)
    } else if (sortBy === "price_desc") {
      return (b._minPrice || 0) - (a._minPrice || 0)
    } else {
      // created_at: 按创建时间降序（最新的在前）
      return new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
    }
  })

  return sortedProducts
}
