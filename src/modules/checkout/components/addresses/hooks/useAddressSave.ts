"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { setAddresses } from "@lib/data/cart"
import type { AddressFormData, SaveState } from "../types"
import {
  isAddressComplete,
  validateShippingPhone,
  validateBillingPhone,
  buildAddressFormData,
  isInvalidCartItemError,
} from "../utils"

interface UseAddressSaveProps {
  onSaveSuccess?: () => void
}

interface UseAddressSaveReturn extends SaveState {
  saveAddresses: (data: AddressFormData, sameAsBilling: boolean) => Promise<void>
  setSaveError: (error: string | null) => void
  clearAutoSaveTimeout: () => void
  autoSaveTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
  hasAutoSavedRef: React.MutableRefObject<boolean>
}

/**
 * 地址保存逻辑 Hook
 */
export function useAddressSave({ onSaveSuccess }: UseAddressSaveProps = {}): UseAddressSaveReturn {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasAutoSavedRef = useRef<boolean>(false)

  // 清除自动保存定时器
  const clearAutoSaveTimeout = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
      autoSaveTimeoutRef.current = null
    }
  }, [])

  // 保存地址
  const saveAddresses = useCallback(
    async (data: AddressFormData, sameAsBilling: boolean) => {
      // 验证收货地址电话
      const shippingPhoneError = validateShippingPhone(data)
      if (shippingPhoneError) {
        setSaveError(shippingPhoneError)
        return
      }

      // 如果账单地址与收货地址不同，验证账单地址电话
      if (!sameAsBilling) {
        const billingPhoneError = validateBillingPhone(data)
        if (billingPhoneError) {
          setSaveError(billingPhoneError)
          return
        }
      }

      // 验证地址完整性
      if (!isAddressComplete(data, sameAsBilling)) {
        return
      }

      setIsSaving(true)
      setSaveError(null)
      setSaveSuccess(false)

      try {
        const formData = buildAddressFormData(data, sameAsBilling)
        const error = await setAddresses(null, formData)

        if (error) {
          // 检查是否是购物车无效商品错误
          if (isInvalidCartItemError(error)) {
            router.refresh()
            // 延迟重试保存地址
            setTimeout(async () => {
              try {
                const retryError = await setAddresses(null, formData)
                if (retryError) {
                  setSaveError(
                    "Cart contains invalid items, please refresh the page and try again"
                  )
                } else {
                  setSaveError(null)
                  setSaveSuccess(true)
                  onSaveSuccess?.()
                  clearAutoSaveTimeout()
                  setTimeout(() => router.refresh(), 500)
                }
              } catch {
                setSaveError(
                  "Cart contains invalid items, please refresh the page and try again"
                )
              }
            }, 1000)
            return
          }
          setSaveError(error)
          setSaveSuccess(false)
        } else {
          setSaveError(null)
          setSaveSuccess(true)
          onSaveSuccess?.()
          clearAutoSaveTimeout()
          setTimeout(() => router.refresh(), 500)
        }
      } catch (error: any) {
        const errorMessage = error.message || "Failed to save address"
        if (isInvalidCartItemError(errorMessage)) {
          setSaveError(
            "Cart contains invalid items, please refresh the page and try again"
          )
          router.refresh()
        } else {
          setSaveError(errorMessage)
        }
        setSaveSuccess(false)
      } finally {
        setIsSaving(false)
      }
    },
    [router, onSaveSuccess, clearAutoSaveTimeout]
  )

  return {
    isSaving,
    saveError,
    saveSuccess,
    saveAddresses,
    setSaveError,
    clearAutoSaveTimeout,
    autoSaveTimeoutRef,
    hasAutoSavedRef,
  }
}
