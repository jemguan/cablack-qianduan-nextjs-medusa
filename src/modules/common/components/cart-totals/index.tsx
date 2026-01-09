"use client"

import { convertToLocale } from "@lib/util/money"
import React from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    discount_subtotal?: number | null
    discount_total?: number | null
  }
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const {
    currency_code,
    total,
    tax_total,
    item_subtotal,
    shipping_subtotal,
    discount_subtotal,
  } = totals

  // 使用 discount_subtotal（不含税的折扣）与 Subtotal (excl. taxes) 保持一致
  // discount_total 包含税额，会导致折扣金额超过商品不含税价格
  const discountAmount = discount_subtotal ?? 0

  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Subtotal (excl. shipping and taxes)</span>
          <span className="text-foreground" data-testid="cart-subtotal" data-value={item_subtotal || 0}>
            {convertToLocale({ amount: item_subtotal ?? 0, currency_code })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Shipping</span>
          <span className="text-foreground" data-testid="cart-shipping" data-value={shipping_subtotal || 0}>
            {convertToLocale({ amount: shipping_subtotal ?? 0, currency_code })}
          </span>
        </div>
        {!!discountAmount && (
          <div className="flex items-center justify-between">
            <span>Discount</span>
            <span
              className="text-primary font-semibold"
              data-testid="cart-discount"
              data-value={discountAmount || 0}
            >
              -{" "}
              {convertToLocale({
                amount: discountAmount ?? 0,
                currency_code,
              })}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="flex gap-x-1 items-center ">Taxes</span>
          <span className="text-foreground" data-testid="cart-taxes" data-value={tax_total || 0}>
            {convertToLocale({ amount: tax_total ?? 0, currency_code })}
          </span>
        </div>
      </div>
      <div className="h-px w-full border-b border-border my-4" />
      <div className="flex items-center justify-between text-foreground mb-2 txt-medium">
        <span className="font-semibold text-lg">Total</span>
        <span
          className="txt-xlarge-plus font-bold text-xl"
          data-testid="cart-total"
          data-value={total || 0}
        >
          {convertToLocale({ amount: total ?? 0, currency_code })}
        </span>
      </div>
      <div className="h-px w-full border-b border-border mt-4" />
    </div>
  )
}

export default CartTotals
