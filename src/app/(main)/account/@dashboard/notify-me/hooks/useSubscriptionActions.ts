"use client"

import { useState, useCallback } from "react"
import { addToCart } from "@lib/data/cart"
import { triggerRestockCheck } from "@lib/data/restock-subscriptions"
import type { RestockItem } from "../types"

interface UseSubscriptionActionsOptions {
  unsubscribe: (id: string) => Promise<void>
  refreshSubscriptions: () => Promise<void>
  reloadProductData: () => Promise<void>
}

/**
 * 处理订阅相关操作
 */
export function useSubscriptionActions({
  unsubscribe,
  refreshSubscriptions,
  reloadProductData,
}: UseSubscriptionActionsOptions) {
  const [isUnsubscribing, setIsUnsubscribing] = useState<string | null>(null)
  const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null)
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false)

  const handleUnsubscribe = useCallback(
    async (subscriptionId: string) => {
      setIsUnsubscribing(subscriptionId)
      try {
        await unsubscribe(subscriptionId)
      } catch (error) {
        console.error("Failed to unsubscribe:", error)
      } finally {
        setIsUnsubscribing(null)
      }
    },
    [unsubscribe]
  )

  const handleAddToCart = useCallback(
    async (subscription: RestockItem, product: any) => {
      if (!product?.variants?.[0]?.id) return

      setIsAddingToCart(subscription.id)
      try {
        await addToCart({
          variantId: product.variants[0].id,
          quantity: 1,
        })
        await unsubscribe(subscription.id)
        await refreshSubscriptions()
      } catch (error) {
        console.error("Failed to add to cart:", error)
      } finally {
        setIsAddingToCart(null)
      }
    },
    [unsubscribe, refreshSubscriptions]
  )

  const handleRefreshStatus = useCallback(async () => {
    setIsRefreshingStatus(true)
    try {
      const result = await triggerRestockCheck()
      console.log("Restock check result:", result)
      await refreshSubscriptions()
      await reloadProductData()
    } catch (error) {
      console.error("Error refreshing restock status:", error)
    } finally {
      setIsRefreshingStatus(false)
    }
  }, [refreshSubscriptions, reloadProductData])

  return {
    isUnsubscribing,
    isAddingToCart,
    isRefreshingStatus,
    handleUnsubscribe,
    handleAddToCart,
    handleRefreshStatus,
  }
}
