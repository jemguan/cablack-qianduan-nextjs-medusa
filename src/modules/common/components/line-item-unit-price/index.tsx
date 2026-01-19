import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"

type LineItemUnitPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
  currencyCode: string
  showPreTaxPrice?: boolean
}

const LineItemUnitPrice = ({
  item,
  style = "default",
  currencyCode,
  showPreTaxPrice = false,
}: LineItemUnitPriceProps) => {
  const { total, original_total, unit_price, subtotal, tax_total, original_subtotal } = item as any
  
  // 如果要求显示税前价格，计算税前单价
  // 使用 subtotal（产品小计，不含订单级别折扣）
  let unitPrice = unit_price || (total / item.quantity)
  if (showPreTaxPrice) {
    if (subtotal !== undefined && subtotal !== null) {
      unitPrice = subtotal / item.quantity
    } else if (tax_total !== undefined && tax_total !== null && tax_total > 0) {
      unitPrice = (total - tax_total) / item.quantity
    } else {
      // 如果没有 subtotal 和 tax_total，假设 unit_price 已经是税前价格，或者使用 total（如果 unit_price 不存在）
      unitPrice = unit_price || (total / item.quantity)
    }
  }
  
  // 获取对比价格（从 variant metadata 中）
  let compareAtPriceAmount: number | null = null
  if (item.variant?.metadata?.compare_at_price) {
    const comparePrice = item.variant.metadata.compare_at_price
    compareAtPriceAmount = typeof comparePrice === 'number'
      ? comparePrice
      : parseInt(String(comparePrice), 10)
    
    if (isNaN(compareAtPriceAmount)) {
      compareAtPriceAmount = null
    }
  }

  // 确定原价：只显示产品级别的折扣（Price List 促销），不显示订单级别折扣（优惠码、VIP折扣）
  // 
  // 区分产品折扣和订单折扣：
  // - 产品级别折扣：original_subtotal > subtotal 或 original_total > subtotal（Price List 促销）
  // - 订单级别折扣：subtotal > total（优惠码应用于订单）
  //
  // 我们只应该显示产品级别的折扣作为划线价格
  let originalUnitPrice: number | null = null
  let shouldShowComparePrice = false

  // 检查是否有产品级别的折扣（Price List 促销）
  // 使用 original_subtotal 或 original_total 与 subtotal 比较
  const originalSubtotalValue = original_subtotal ?? original_total
  if (originalSubtotalValue && subtotal && originalSubtotalValue > subtotal) {
    // 产品本身有折扣（Price List 促销）
    originalUnitPrice = originalSubtotalValue / item.quantity
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
