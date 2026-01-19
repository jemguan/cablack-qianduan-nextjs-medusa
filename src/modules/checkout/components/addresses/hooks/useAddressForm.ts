"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { HttpTypes } from "@medusajs/types"
import type { AddressFormData } from "../types"
import { initShippingFormData, initBillingFormData } from "../utils"

interface UseAddressFormProps {
  cart: HttpTypes.StoreCart | null
}

interface UseAddressFormReturn {
  shippingFormData: AddressFormData
  billingFormData: AddressFormData
  shippingFormDataRef: React.MutableRefObject<AddressFormData>
  billingFormDataRef: React.MutableRefObject<AddressFormData>
  handleShippingFormDataChange: (data: AddressFormData) => void
  handleBillingFormDataChange: (data: AddressFormData) => void
  getMergedFormData: () => AddressFormData
}

/**
 * 地址表单数据管理 Hook
 */
export function useAddressForm({ cart }: UseAddressFormProps): UseAddressFormReturn {
  const [shippingFormData, setShippingFormData] = useState<AddressFormData>({})
  const [billingFormData, setBillingFormData] = useState<AddressFormData>({})
  const shippingFormDataRef = useRef<AddressFormData>({})
  const billingFormDataRef = useRef<AddressFormData>({})

  // 初始化表单数据
  useEffect(() => {
    if (cart) {
      const initialShippingData = initShippingFormData(cart)
      const initialBillingData = initBillingFormData(cart)

      shippingFormDataRef.current = initialShippingData
      billingFormDataRef.current = initialBillingData
      setShippingFormData(initialShippingData)
      setBillingFormData(initialBillingData)
    }
  }, [cart])

  // 处理收货地址表单数据变化
  const handleShippingFormDataChange = useCallback((data: AddressFormData) => {
    shippingFormDataRef.current = data
    setShippingFormData(data)
  }, [])

  // 处理账单地址表单数据变化
  const handleBillingFormDataChange = useCallback((data: AddressFormData) => {
    billingFormDataRef.current = data
    setBillingFormData(data)
  }, [])

  // 获取合并后的表单数据
  const getMergedFormData = useCallback(() => {
    return {
      ...shippingFormDataRef.current,
      ...billingFormDataRef.current,
    }
  }, [])

  return {
    shippingFormData,
    billingFormData,
    shippingFormDataRef,
    billingFormDataRef,
    handleShippingFormDataChange,
    handleBillingFormDataChange,
    getMergedFormData,
  }
}
