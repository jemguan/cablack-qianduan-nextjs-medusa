"use client"

import { memo } from "react"
import { Text, clx } from "@medusajs/ui"
import { VariantPrice } from "types/global"

// 使用 memo 优化，避免父组件渲染时不必要的重渲染
const PreviewPriceClient = memo(function PreviewPriceClient({
  price,
  selectedVariant
}: {
  price: VariantPrice
  selectedVariant?: any
}) {
  if (!price) {
    return null
  }

  // 只有在选择了对应变体时才显示对比价格
  // 检查是否需要显示对比价格（现价低于原价，且已选择变体）
  // 如果价格和对比价格相等，则不显示对比价格
  const showComparePrice = selectedVariant &&
    price.price_type === "sale" && 
    price.original_price_number > price.calculated_price_number &&
    Math.abs(price.original_price_number - price.calculated_price_number) > 0.01 // 允许小的浮点数误差

  return (
    <div className="flex items-center gap-x-2 flex-wrap">
      {showComparePrice && (
        <Text
          className="line-through text-ui-fg-muted"
          data-testid="original-price"
        >
          {price.original_price}
        </Text>
      )}
      <Text
        className={clx("text-ui-fg-muted", {
          "text-ui-fg-interactive": showComparePrice,
        })}
        data-testid="price"
      >
        {price.calculated_price}
      </Text>
    </div>
  )
})

export default PreviewPriceClient

