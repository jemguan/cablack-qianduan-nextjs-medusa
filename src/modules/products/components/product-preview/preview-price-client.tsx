"use client"

import { Text, clx } from "@medusajs/ui"
import { VariantPrice } from "types/global"

export default function PreviewPriceClient({ 
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
    price.original_price_number !== price.calculated_price_number

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
}

