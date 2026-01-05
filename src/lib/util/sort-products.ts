import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

interface MinPricedProduct extends HttpTypes.StoreProduct {
  _minPrice?: number
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
  let sortedProducts = products as MinPricedProduct[]

  if (["price_asc", "price_desc"].includes(sortBy)) {
    // Precompute the minimum price for each product
    sortedProducts.forEach((product) => {
      if (product.variants && product.variants.length > 0) {
        product._minPrice = Math.min(
          ...product.variants.map(
            (variant) => variant?.calculated_price?.calculated_amount || 0
          )
        )
      } else {
        product._minPrice = Infinity
      }
    })

    // Sort products based on the precomputed minimum prices
    sortedProducts.sort((a, b) => {
      const diff = a._minPrice! - b._minPrice!
      return sortBy === "price_asc" ? diff : -diff
    })
  }

  if (sortBy === "created_at") {
    sortedProducts.sort((a, b) => {
      return (
        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
      )
    })
  }

  // 在所有排序完成后，将缺货产品移到列表后面
  // 保持有货产品之间的相对顺序不变，缺货产品之间的相对顺序不变
  sortedProducts.sort((a, b) => {
    const aOutOfStock = isProductOutOfStock(a)
    const bOutOfStock = isProductOutOfStock(b)

    // 如果都是缺货或都有货，保持原有顺序（返回 0）
    if (aOutOfStock === bOutOfStock) return 0

    // 缺货的排在后面
    return aOutOfStock ? 1 : -1
  })

  return sortedProducts
}
