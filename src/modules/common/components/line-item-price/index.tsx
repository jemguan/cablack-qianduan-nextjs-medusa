import { getPercentageDiff } from "@lib/util/get-percentage-diff"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"

type LineItemPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
  currencyCode: string
  showPreTaxPrice?: boolean
}

const LineItemPrice = ({
  item,
  style = "default",
  currencyCode,
  showPreTaxPrice = false,
}: LineItemPriceProps) => {
  const { total, original_total, subtotal, tax_total } = item as any
  // 如果要求显示税前价格，优先使用 subtotal，否则从 total 中减去税费
  let currentPrice = total
  if (showPreTaxPrice) {
    if (subtotal !== undefined && subtotal !== null) {
      currentPrice = subtotal
    } else if (tax_total !== undefined && tax_total !== null) {
      currentPrice = total - tax_total
    }
  }
  
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
  // 注意：如果显示税前价格，不显示对比价格（因为价格基准不同）
  let originalPrice = original_total
  let shouldShowComparePrice = false

  // 只有在不显示税前价格时才显示对比价格
  if (!showPreTaxPrice) {
    // 如果 original_total 存在且大于 currentPrice，说明有 Price List 促销价格
    if (original_total && original_total > currentPrice) {
      originalPrice = original_total
      shouldShowComparePrice = true
    } 
    // 如果没有 Price List 原价，但有对比价格，且现价低于对比价格，使用对比价格
    else if (compareAtPriceAmount !== null) {
      // 对比价格存储为分（单价），需要转换为元，然后乘以数量得到总价
      const compareAtPricePerUnitInDollars = compareAtPriceAmount / 100
      const compareAtPriceTotal = compareAtPricePerUnitInDollars * item.quantity
      
      // currentPrice 是总价（元），compareAtPriceTotal 也是总价（元）
      if (compareAtPriceTotal > currentPrice) {
        originalPrice = compareAtPriceTotal
        shouldShowComparePrice = true
      }
    }
  } else {
    // 当显示税前价格时，强制不显示对比价格
    shouldShowComparePrice = false
  }

  const hasReducedPrice = shouldShowComparePrice && currentPrice < originalPrice

  return (
    <div className="flex flex-col gap-x-2 text-ui-fg-subtle items-end">
      <div className="text-left">
        {hasReducedPrice && (
          <>
            <p>
              {style === "default" && (
                <span className="text-ui-fg-subtle">Original: </span>
              )}
              <span
                className="line-through text-ui-fg-muted"
                data-testid="product-original-price"
              >
                {convertToLocale({
                  amount: originalPrice,
                  currency_code: currencyCode,
                })}
              </span>
            </p>
            {style === "default" && (
              <span className="text-ui-fg-interactive">
                -{getPercentageDiff(originalPrice, currentPrice || 0)}%
              </span>
            )}
          </>
        )}
        <span
          className={clx("text-base-regular", {
            "text-ui-fg-interactive": hasReducedPrice,
          })}
          data-testid="product-price"
        >
          {convertToLocale({
            amount: currentPrice,
            currency_code: currencyCode,
          })}
        </span>
      </div>
    </div>
  )
}

export default LineItemPrice
