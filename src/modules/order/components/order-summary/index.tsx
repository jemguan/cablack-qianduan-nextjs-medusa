import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OrderSummaryProps = {
  order: HttpTypes.StoreOrder
}

const OrderSummary = ({ order }: OrderSummaryProps) => {
  const getAmount = (amount?: number | null) => {
    if (!amount) {
      return
    }

    return convertToLocale({
      amount,
      currency_code: order.currency_code,
    })
  }

  // 使用与 CartTotals 一致的字段
  // item_subtotal: 商品小计（不含运费和税）
  // discount_subtotal: 折扣金额（不含税）- 与 Subtotal 保持一致的税前基准
  // shipping_subtotal: 运费小计（不含税）
  const orderAny = order as any
  const itemSubtotal = orderAny.item_subtotal ?? order.subtotal
  const discountSubtotal = orderAny.discount_subtotal ?? order.discount_total
  const shippingSubtotal = orderAny.shipping_subtotal ?? order.shipping_total

  return (
    <div>
      <h2 className="text-base-semi">Order Summary</h2>
      <div className="text-small-regular text-ui-fg-base my-2">
        <div className="flex items-center justify-between text-base-regular text-ui-fg-base mb-2">
          <span>Subtotal</span>
          <span>{getAmount(itemSubtotal)}</span>
        </div>
        <div className="flex flex-col gap-y-1">
          {discountSubtotal > 0 && (
            <div className="flex items-center justify-between">
              <span>Discount</span>
              <span className="text-ui-fg-interactive">- {getAmount(discountSubtotal)}</span>
            </div>
          )}
          {order.gift_card_total > 0 && (
            <div className="flex items-center justify-between">
              <span>Gift Card</span>
              <span className="text-ui-fg-interactive">- {getAmount(order.gift_card_total)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span>Shipping</span>
            <span>{getAmount(shippingSubtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Taxes</span>
            <span>{getAmount(order.tax_total)}</span>
          </div>
        </div>
        <div className="h-px w-full border-b border-gray-200 border-dashed my-4" />
        <div className="flex items-center justify-between text-base-regular text-ui-fg-base mb-2">
          <span>Total</span>
          <span>{getAmount(order.total)}</span>
        </div>
      </div>
    </div>
  )
}

export default OrderSummary
