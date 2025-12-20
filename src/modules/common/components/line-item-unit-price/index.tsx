import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"

type LineItemUnitPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
  currencyCode: string
}

const LineItemUnitPrice = ({
  item,
  style = "default",
  currencyCode,
}: LineItemUnitPriceProps) => {
  const { total, original_total } = item
  const unitPrice = total / item.quantity
  
  // 获取对比价格（从 variant metadata 中）
  let compareAtPriceAmount: number | null = null
  if (item.variant?.metadata?.compare_at_price) {
    const comparePrice = item.variant.metadata.compare_at_price
    compareAtPriceAmount = typeof comparePrice === 'number' 
      ? comparePrice 
      : parseInt(comparePrice, 10)
    
    if (isNaN(compareAtPriceAmount)) {
      compareAtPriceAmount = null
    }
  }

  // 确定原价：优先使用 original_total（Price List 原价），如果没有则使用对比价格
  let originalUnitPrice = original_total ? original_total / item.quantity : null
  let shouldShowComparePrice = false

  // 如果 original_total 存在且大于 total，说明有 Price List 促销价格
  if (original_total && original_total > total) {
    originalUnitPrice = original_total / item.quantity
    shouldShowComparePrice = true
  } 
  // 如果没有 Price List 原价，但有对比价格，且现价低于对比价格，使用对比价格
  else if (compareAtPriceAmount !== null) {
    // 对比价格存储为分，需要转换为元
    const compareAtPriceInDollars = compareAtPriceAmount / 100
    if (compareAtPriceInDollars > unitPrice) {
      originalUnitPrice = compareAtPriceInDollars
      shouldShowComparePrice = true
    }
  }

  const hasReducedPrice = shouldShowComparePrice && originalUnitPrice !== null && unitPrice < originalUnitPrice

  const percentage_diff = hasReducedPrice && originalUnitPrice
    ? Math.round(((originalUnitPrice - unitPrice) / originalUnitPrice) * 100)
    : 0

  return (
    <div className="flex flex-col text-ui-fg-muted justify-center h-full">
      {hasReducedPrice && originalUnitPrice !== null && (
        <>
          <p>
            {style === "default" && (
              <span className="text-ui-fg-muted">Original: </span>
            )}
            <span
              className="line-through"
              data-testid="product-unit-original-price"
            >
              {convertToLocale({
                amount: originalUnitPrice,
                currency_code: currencyCode,
              })}
            </span>
          </p>
          {style === "default" && percentage_diff > 0 && (
            <span className="text-ui-fg-interactive">-{percentage_diff}%</span>
          )}
        </>
      )}
      <span
        className={clx("text-base-regular", {
          "text-ui-fg-interactive": hasReducedPrice,
        })}
        data-testid="product-unit-price"
      >
        {convertToLocale({
          amount: unitPrice,
          currency_code: currencyCode,
        })}
      </span>
    </div>
  )
}

export default LineItemUnitPrice
