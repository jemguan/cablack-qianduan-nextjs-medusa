import { clx } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  // 只有在选择了对应变体时才显示对比价格
  // 检查是否需要显示对比价格（现价低于原价，且已选择变体）
  const showComparePrice = variant && 
    selectedPrice.price_type === "sale" && 
    selectedPrice.original_price_number > selectedPrice.calculated_price_number

  // 只有在没有选择变体时才显示 "From"
  // 如果 variant 存在且有 variantPrice，说明已选择变体，不显示 "From"
  const showFromPrefix = !variant || !variantPrice

  return (
    <div className="flex flex-col text-ui-fg-base" suppressHydrationWarning>
      <div className="flex items-center gap-x-2 flex-wrap">
        {showComparePrice && (
      <span
            className="line-through text-ui-fg-muted text-lg"
            data-testid="original-product-price"
            data-value={selectedPrice.original_price_number}
          >
            {selectedPrice.original_price}
          </span>
        )}
        <span
          className={clx("text-xl-semi text-ui-fg-base", {
            "text-ui-fg-interactive": showComparePrice,
        })}
      >
          {showFromPrefix && "From "}
        <span
          data-testid="product-price"
          data-value={selectedPrice.calculated_price_number}
        >
          {selectedPrice.calculated_price}
        </span>
      </span>
        {showComparePrice && selectedPrice.percentage_diff !== "0" && (
          <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-md">
            -{selectedPrice.percentage_diff}%
          </span>
      )}
      </div>
    </div>
  )
}
