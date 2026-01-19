"use client"

import { useState } from "react"
import { Text, Button } from "@medusajs/ui"
import type { HttpTypes } from "@medusajs/types"
import ChevronDown from "@modules/common/icons/chevron-down"
import ChevronUp from "@modules/common/icons/chevron-up"

interface AddressSummaryProps {
  cart: HttpTypes.StoreCart
  sameAsBilling: boolean
  onEdit: () => void
}

/**
 * 地址摘要显示组件
 */
export function AddressSummary({ cart, sameAsBilling, onEdit }: AddressSummaryProps) {
  const [isBillingExpanded, setIsBillingExpanded] = useState(false)

  return (
    <div>
      <div className="text-small-regular">
        {/* 手机端：一行2个，Billing Address 折叠到第二行 */}
        <div className="flex flex-wrap items-start gap-x-4 gap-y-4 small:gap-x-8">
          {/* 第一行：Shipping Address 和 Contact */}
          <div className="flex flex-wrap items-start gap-x-4 gap-y-4 w-full small:w-auto">
            <div
              className="flex flex-col w-[calc(50%-0.5rem)] small:w-1/3"
              data-testid="shipping-address-summary"
            >
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Shipping Address
              </Text>
              <Text className="txt-medium text-ui-fg-subtle">
                {cart.shipping_address?.first_name} {cart.shipping_address?.last_name}
              </Text>
              <Text className="txt-medium text-ui-fg-subtle">
                {cart.shipping_address?.address_1} {cart.shipping_address?.address_2}
              </Text>
              <Text className="txt-medium text-ui-fg-subtle">
                {cart.shipping_address?.postal_code}, {cart.shipping_address?.city}
              </Text>
              <Text className="txt-medium text-ui-fg-subtle">
                {cart.shipping_address?.country_code?.toUpperCase()}
              </Text>
            </div>

            <div
              className="flex flex-col w-[calc(50%-0.5rem)] small:w-1/3"
              data-testid="shipping-contact-summary"
            >
              <Text className="txt-medium-plus text-ui-fg-base mb-1">Contact</Text>
              <Text className="txt-medium text-ui-fg-subtle">
                {cart.shipping_address?.phone}
              </Text>
              <Text className="txt-medium text-ui-fg-subtle break-words break-all">
                {cart.email}
              </Text>
            </div>
          </div>

          {/* 第二行：Billing Address（手机端折叠，桌面端始终显示） */}
          <div
            className="flex flex-col w-full small:w-1/3"
            data-testid="billing-address-summary"
          >
            {/* 手机端：可折叠的标题 */}
            <button
              onClick={() => setIsBillingExpanded(!isBillingExpanded)}
              className="small:hidden flex items-center justify-between w-full mb-1"
              aria-expanded={isBillingExpanded}
            >
              <Text className="txt-medium-plus text-ui-fg-base">Billing Address</Text>
              {isBillingExpanded ? (
                <ChevronUp size={16} className="text-ui-fg-muted" />
              ) : (
                <ChevronDown size={16} className="text-ui-fg-muted" />
              )}
            </button>

            {/* 桌面端：普通标题 */}
            <Text className="hidden small:block txt-medium-plus text-ui-fg-base mb-1">
              Billing Address
            </Text>

            {/* 内容区域 - 手机端可折叠，桌面端始终显示 */}
            <div className={isBillingExpanded ? "block" : "hidden small:block"}>
              {sameAsBilling ? (
                <Text className="txt-medium text-ui-fg-subtle">
                  Billing and delivery address are the same.
                </Text>
              ) : (
                <>
                  <Text className="txt-medium text-ui-fg-subtle">
                    {cart.billing_address?.first_name} {cart.billing_address?.last_name}
                  </Text>
                  <Text className="txt-medium text-ui-fg-subtle">
                    {cart.billing_address?.address_1} {cart.billing_address?.address_2}
                  </Text>
                  <Text className="txt-medium text-ui-fg-subtle">
                    {cart.billing_address?.postal_code}, {cart.billing_address?.city}
                  </Text>
                  <Text className="txt-medium text-ui-fg-subtle">
                    {cart.billing_address?.country_code?.toUpperCase()}
                  </Text>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <Button
          onClick={onEdit}
          variant="secondary"
          className="w-full sm:w-auto"
          data-testid="change-address-button"
        >
          Change
        </Button>
      </div>
    </div>
  )
}
