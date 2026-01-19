"use client"

import { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import type { HttpTypes } from "@medusajs/types"
import { addToCart } from "@lib/data/cart"
import { useRestockNotify } from "@lib/context/restock-notify-context"

interface UseQuickViewActionsProps {
  product: HttpTypes.StoreProduct
  selectedVariant: HttpTypes.StoreProductVariant | null | undefined
  quantity: number
  inStock: boolean
  isValidVariant: boolean
  customer?: HttpTypes.StoreCustomer | null
  onClose: () => void
}

export function useQuickViewActions({
  product,
  selectedVariant,
  quantity,
  inStock,
  isValidVariant,
  customer,
  onClose,
}: UseQuickViewActionsProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [isTogglingNotify, setIsTogglingNotify] = useState(false)
  const params = useParams()
  const countryCode = params?.countryCode as string
  const router = useRouter()
  const {
    isSubscribedToVariant,
    toggleRestockSubscription,
    isLoading: isNotifyLoading,
  } = useRestockNotify()

  // 检查当前变体是否已订阅补货通知
  const isSubscribed = useMemo(() => {
    if (!selectedVariant) return false
    return isSubscribedToVariant(selectedVariant.id)
  }, [selectedVariant, isSubscribedToVariant])

  // 处理补货通知订阅/取消订阅
  const handleNotifyMe = async () => {
    if (!selectedVariant) return

    if (!customer) {
      // 未登录，跳转到登录页
      onClose()
      router.push("/account")
      return
    }

    setIsTogglingNotify(true)
    try {
      await toggleRestockSubscription(
        product,
        selectedVariant,
        customer.email || ""
      )
    } catch (error) {
      console.error("Failed to toggle notification:", error)
    } finally {
      setIsTogglingNotify(false)
    }
  }

  // 处理加入购物车
  const handleAddToCart = async () => {
    if (!selectedVariant?.id || !inStock || !isValidVariant) {
      return
    }

    setIsAdding(true)

    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity,
        countryCode,
      })

      // addToCart 内部已调用 revalidateTag，无需 router.refresh()
      // 添加成功后关闭模态框
      onClose()
    } catch (error) {
      console.error("Failed to add to cart:", error)
    } finally {
      setIsAdding(false)
    }
  }

  // 处理登录跳转
  const handleLoginRequired = () => {
    onClose()
    router.push("/account")
  }

  return {
    isAdding,
    isTogglingNotify,
    isNotifyLoading,
    isSubscribed,
    handleNotifyMe,
    handleAddToCart,
    handleLoginRequired,
  }
}
