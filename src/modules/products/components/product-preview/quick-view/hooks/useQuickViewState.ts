"use client"

import { useState, useMemo, useEffect } from "react"
import { isEqual } from "lodash"
import type { HttpTypes } from "@medusajs/types"
import type { LoyaltyAccount } from "@/types/loyalty"
import { optionsAsKeymap } from "../utils"

interface UseQuickViewStateProps {
  product: HttpTypes.StoreProduct
  customer?: HttpTypes.StoreCustomer | null
  loyaltyAccount?: LoyaltyAccount | null
  membershipProductIds?: Record<string, boolean> | null
}

export function useQuickViewState({
  product,
  customer,
  loyaltyAccount,
  membershipProductIds,
}: UseQuickViewStateProps) {
  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [quantity, setQuantity] = useState(1)

  // Initialize options if product has only one variant
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  // 选中的变体
  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return null
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // 当变体变化时，重置数量为1
  useEffect(() => {
    setQuantity(1)
  }, [selectedVariant?.id])

  // 计算最大可选数量（基于库存）
  const maxQuantity = useMemo(() => {
    if (!selectedVariant) return 99
    if (!selectedVariant.manage_inventory) return 99
    if (selectedVariant.allow_backorder) return 99
    return Math.min(selectedVariant.inventory_quantity || 99, 99)
  }, [selectedVariant])

  // 检查变体是否有库存
  const inStock = useMemo(() => {
    if (!selectedVariant) return false
    if (!selectedVariant.manage_inventory) return true
    if (selectedVariant.allow_backorder) return true
    return (selectedVariant.inventory_quantity || 0) > 0
  }, [selectedVariant])

  // 检查选中的变体是否有效
  const isValidVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return false
    return product.variants.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // 检查当前产品是否是会员产品
  const isMembershipProduct = useMemo(() => {
    if (!membershipProductIds || !product.id) return false
    return membershipProductIds[product.id] === true
  }, [membershipProductIds, product.id])

  // 检查用户是否是 VIP
  const isVip = useMemo(() => {
    if (!loyaltyAccount) return false
    if (!loyaltyAccount.is_member) return false
    if (!loyaltyAccount.membership_expires_at) return false
    return new Date(loyaltyAccount.membership_expires_at) > new Date()
  }, [loyaltyAccount])

  // 检查用户是否已登录
  const isLoggedIn = !!customer

  const handleOptionChange = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  return {
    options,
    quantity,
    setQuantity,
    selectedVariant,
    maxQuantity,
    inStock,
    isValidVariant,
    isMembershipProduct,
    isVip,
    isLoggedIn,
    handleOptionChange,
  }
}
