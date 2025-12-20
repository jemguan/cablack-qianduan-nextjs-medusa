"use client"

import { useVariantSelection } from "@modules/products/contexts/variant-selection-context"
import ProductPrice from "./index"
import { HttpTypes } from "@medusajs/types"

type ConditionalPriceProps = {
  product: HttpTypes.StoreProduct
}

export default function ConditionalPrice({ product }: ConditionalPriceProps) {
  const { selectedVariant } = useVariantSelection()
  
  // 如果产品有多个变体，则隐藏这个价格显示（因为变体选择器下方会显示价格）
  // 如果产品只有一个变体或没有变体，显示价格
  const hasMultipleVariants = (product.variants?.length ?? 0) > 1

  if (hasMultipleVariants) {
    return null
  }

  return <ProductPrice product={product} />
}

