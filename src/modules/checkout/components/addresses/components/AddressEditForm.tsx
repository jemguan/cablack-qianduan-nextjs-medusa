"use client"

import { CheckCircleSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Button, Heading, Text } from "@medusajs/ui"
import Spinner from "@modules/common/icons/spinner"
import BillingAddress from "../../billing_address"
import ShippingAddress from "../../shipping-address"
import type { AddressFormData, SaveState } from "../types"

interface AddressEditFormProps {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  sameAsBilling: boolean
  onToggleSameAsBilling: () => void
  onShippingFormDataChange: (data: AddressFormData) => void
  onBillingFormDataChange: (data: AddressFormData) => void
  onConfirm: () => void
  saveState: SaveState
}

/**
 * 地址编辑表单组件
 */
export function AddressEditForm({
  customer,
  cart,
  sameAsBilling,
  onToggleSameAsBilling,
  onShippingFormDataChange,
  onBillingFormDataChange,
  onConfirm,
  saveState,
}: AddressEditFormProps) {
  const { isSaving, saveError, saveSuccess } = saveState

  return (
    <div>
      <div className="pb-8">
        <ShippingAddress
          customer={customer}
          checked={sameAsBilling}
          onChange={onToggleSameAsBilling}
          cart={cart}
          onFormDataChange={onShippingFormDataChange}
        />

        {!sameAsBilling && (
          <div>
            <Heading level="h2" className="text-3xl-regular gap-x-4 pb-6 pt-8">
              Billing address
            </Heading>

            <BillingAddress cart={cart} onFormDataChange={onBillingFormDataChange} />
          </div>
        )}

        {/* 确认按钮和保存状态指示器 */}
        <div className="mt-6 flex flex-col gap-4">
          <Button
            onClick={onConfirm}
            isLoading={isSaving}
            disabled={isSaving}
            variant="primary"
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white border-none !border-2 !border-orange-600 hover:!border-orange-700 dark:!border-orange-600 dark:hover:!border-orange-700 disabled:!border-ui-border-base !shadow-none"
            style={{
              borderColor: "rgb(234 88 12)",
              borderWidth: "2px",
              borderStyle: "solid",
            }}
            data-testid="confirm-address-button"
          >
            Confirm Address
          </Button>

          <div className="flex items-center gap-2">
            {isSaving && (
              <>
                <Spinner className="animate-spin" />
                <Text className="text-small-regular text-ui-fg-subtle">
                  Saving address...
                </Text>
              </>
            )}
            {saveSuccess && !isSaving && (
              <Text className="text-small-regular text-green-600 flex items-center gap-2">
                <CheckCircleSolid className="w-4 h-4" />
                Address saved successfully
              </Text>
            )}
            {saveError && !isSaving && (
              <Text className="text-small-regular text-red-600">{saveError}</Text>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
