"use client"

import { useEffect } from "react"
import type { HttpTypes } from "@medusajs/types"
import type { AddressFormData } from "../types"
import { isAddressComplete, hasFormData } from "../utils"

interface UseAutoSaveProps {
  cart: HttpTypes.StoreCart | null
  shippingFormData: AddressFormData
  billingFormData: AddressFormData
  sameAsBillingRef: React.MutableRefObject<boolean>
  isEditingAddress: boolean
  isSaving: boolean
  hasAutoSavedRef: React.MutableRefObject<boolean>
  autoSaveTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
  saveAddresses: (data: AddressFormData, sameAsBilling: boolean) => Promise<void>
}

/**
 * 自动保存地址 Hook
 */
export function useAutoSave({
  cart,
  shippingFormData,
  billingFormData,
  sameAsBillingRef,
  isEditingAddress,
  isSaving,
  hasAutoSavedRef,
  autoSaveTimeoutRef,
  saveAddresses,
}: UseAutoSaveProps): void {
  useEffect(() => {
    const hasAddress = cart?.shipping_address && cart?.billing_address

    // 只在首次填写时（没有地址）且不在编辑状态时自动保存
    if (hasAddress || isEditingAddress || isSaving) {
      // 如果有地址了，重置自动保存标记
      if (hasAddress) {
        hasAutoSavedRef.current = false
      }
      return
    }

    const mergedData = {
      ...shippingFormData,
      ...billingFormData,
    }

    // 检查地址是否完整
    if (!isAddressComplete(mergedData, sameAsBillingRef.current)) {
      return
    }

    // 检查数据是否为空（避免初始状态触发保存）
    if (!hasFormData(mergedData)) {
      return
    }

    // 如果已经自动保存过，不再重复保存
    if (hasAutoSavedRef.current) {
      return
    }

    // 清除之前的定时器
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // 防抖：延迟 1000ms 后自动保存
    autoSaveTimeoutRef.current = setTimeout(async () => {
      // 再次检查条件，避免在延迟期间状态变化
      const currentHasAddress = cart?.shipping_address && cart?.billing_address
      if (
        currentHasAddress ||
        isEditingAddress ||
        isSaving ||
        hasAutoSavedRef.current
      ) {
        return
      }

      // 标记为已保存，避免重复
      hasAutoSavedRef.current = true
      await saveAddresses(mergedData, sameAsBillingRef.current)
    }, 1000)

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingFormData, billingFormData, isEditingAddress, isSaving])
}
