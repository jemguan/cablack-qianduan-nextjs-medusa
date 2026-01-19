"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { CheckCircleSolid } from "@medusajs/icons"
import { Heading, useToggleState } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import compareAddresses from "@lib/util/compare-addresses"
import type { AddressesProps } from "./types"
import { isAddressComplete } from "./utils"
import { useAddressForm, useAddressSave, useAutoSave } from "./hooks"
import { AddressSummary, AddressEditForm } from "./components"

const Addresses = ({ cart, customer }: AddressesProps) => {
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const sameAsBillingRef = useRef<boolean>(true)

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  // 表单数据管理
  const {
    shippingFormData,
    billingFormData,
    handleShippingFormDataChange,
    handleBillingFormDataChange,
    getMergedFormData,
  } = useAddressForm({ cart })

  // 保存逻辑
  const {
    isSaving,
    saveError,
    saveSuccess,
    saveAddresses,
    setSaveError,
    autoSaveTimeoutRef,
    hasAutoSavedRef,
  } = useAddressSave({
    onSaveSuccess: () => setIsEditingAddress(false),
  })

  // 更新 sameAsBilling ref
  useEffect(() => {
    sameAsBillingRef.current = sameAsBilling
  }, [sameAsBilling])

  // 重置自动保存标记
  useEffect(() => {
    if (cart) {
      hasAutoSavedRef.current = false
    }
  }, [cart, hasAutoSavedRef])

  // 自动保存
  useAutoSave({
    cart,
    shippingFormData,
    billingFormData,
    sameAsBillingRef,
    isEditingAddress,
    isSaving,
    hasAutoSavedRef,
    autoSaveTimeoutRef,
    saveAddresses,
  })

  // 手动确认并保存地址
  const handleConfirmAddress = useCallback(async () => {
    const mergedData = getMergedFormData()

    // 检查收货地址电话
    if (
      !mergedData["shipping_address.phone"] ||
      String(mergedData["shipping_address.phone"]).trim() === ""
    ) {
      setSaveError("Please enter shipping address phone number (required)")
      return
    }

    // 如果账单地址与收货地址不同，检查账单地址电话
    if (!sameAsBillingRef.current) {
      if (
        !mergedData["billing_address.phone"] ||
        String(mergedData["billing_address.phone"]).trim() === ""
      ) {
        setSaveError("Please enter billing address phone number (required)")
        return
      }
    }

    if (!isAddressComplete(mergedData, sameAsBillingRef.current)) {
      setSaveError("Please fill in all required fields")
      return
    }

    await saveAddresses(mergedData, sameAsBillingRef.current)
  }, [getMergedFormData, saveAddresses, setSaveError])

  const hasAddress = cart?.shipping_address && cart?.billing_address

  return (
    <div className="bg-card">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className="flex flex-row text-3xl-regular gap-x-2 items-baseline"
        >
          Shipping Address
          {hasAddress && !isEditingAddress && <CheckCircleSolid />}
        </Heading>
      </div>

      {hasAddress && !isEditingAddress ? (
        <AddressSummary
          cart={cart}
          sameAsBilling={sameAsBilling}
          onEdit={() => setIsEditingAddress(true)}
        />
      ) : (
        <AddressEditForm
          customer={customer}
          cart={cart}
          sameAsBilling={sameAsBilling}
          onToggleSameAsBilling={toggleSameAsBilling}
          onShippingFormDataChange={handleShippingFormDataChange}
          onBillingFormDataChange={handleBillingFormDataChange}
          onConfirm={handleConfirmAddress}
          saveState={{ isSaving, saveError, saveSuccess }}
        />
      )}

      <Divider className="mt-8" />
    </div>
  )
}

export default Addresses
