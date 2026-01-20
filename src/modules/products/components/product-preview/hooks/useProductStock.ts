import { useMemo } from "react"
import { HttpTypes } from "@medusajs/types"

/**
 * 检查单个变体是否有库存
 */
export function isVariantInStock(
  variant: HttpTypes.StoreProductVariant
): boolean {
  // According to Medusa docs: variant is in stock if manage_inventory === false OR inventory_quantity > 0
  // If inventory is not managed, always in stock
  if (variant.manage_inventory === false) {
    return true
  }
  // If backorder is allowed, always in stock
  if (variant.allow_backorder === true) {
    return true
  }
  // Check inventory quantity (if null/undefined, consider out of stock per Medusa docs)
  return (variant.inventory_quantity || 0) > 0
}

/**
 * Hook 用于检查产品库存状态
 * @param product - 产品对象
 * @param selectedVariant - 选中的变体（可选）
 * @returns 是否有库存
 */
export function useProductStock(
  product: HttpTypes.StoreProduct,
  selectedVariant: HttpTypes.StoreProductVariant | null
): boolean {
  return useMemo(() => {
    // If no variants, assume in stock
    if (!product.variants || product.variants.length === 0) {
      return true
    }

    // If no variant selected, check if any variant is in stock
    if (!selectedVariant) {
      return product.variants.some((v) => isVariantInStock(v))
    }

    // Check selected variant
    return isVariantInStock(selectedVariant)
  }, [selectedVariant, product.variants])
}
