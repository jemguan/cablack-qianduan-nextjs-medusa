"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react"
import { HttpTypes } from "@medusajs/types"
import {
  getRestockSubscriptions,
  subscribeToRestock,
  unsubscribeFromRestock,
  checkRestockSubscribed,
  RestockSubscription,
  SubscribeToRestockData,
} from "@lib/data/restock-subscriptions"

interface RestockNotifyContextValue {
  // State
  isLoading: boolean
  isAuthenticated: boolean
  subscriptions: RestockSubscription[]
  itemCount: number

  // Methods
  isSubscribedToVariant: (variantId: string) => boolean
  isSubscribedToProduct: (productId: string) => boolean
  toggleRestockSubscription: (
    product: HttpTypes.StoreProduct,
    variant: HttpTypes.StoreProductVariant,
    email: string
  ) => Promise<void>
  subscribe: (data: SubscribeToRestockData) => Promise<void>
  unsubscribe: (subscriptionId: string) => Promise<void>
  refreshSubscriptions: () => Promise<void>
  checkSubscriptionStatus: (variantId: string) => Promise<boolean>
}

const RestockNotifyContext = createContext<RestockNotifyContextValue | null>(null)

interface RestockNotifyProviderProps {
  children: React.ReactNode
  customer?: HttpTypes.StoreCustomer | null
}

export const RestockNotifyProvider = ({
  children,
  customer,
}: RestockNotifyProviderProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [subscriptions, setSubscriptions] = useState<RestockSubscription[]>([])

  const isAuthenticated = !!customer

  // 加载订阅列表
  const loadSubscriptions = useCallback(async () => {
    if (!isAuthenticated) {
      setSubscriptions([])
      return
    }

    setIsLoading(true)
    try {
      const result = await getRestockSubscriptions(100, 0)
      setSubscriptions(result.subscriptions || [])
    } catch (error) {
      console.error("Failed to load subscriptions:", error)
      setSubscriptions([])
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  // 初始加载和客户变化时重新加载
  useEffect(() => {
    if (isAuthenticated) {
      loadSubscriptions()
    }
  }, [isAuthenticated, loadSubscriptions])

  // Auto-refresh subscription status (once per day)
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      loadSubscriptions()
    }, 86400000) // 24 hours = 86400000ms

    return () => clearInterval(interval)
  }, [isAuthenticated, loadSubscriptions])

  // 使用 useMemo 创建订阅 ID 的 Set，避免每次都遍历数组
  const subscribedVariantIds = useMemo(() => {
    return new Set(
      subscriptions
        .filter((sub) => sub.status === "active")
        .map((sub) => sub.variant_id)
    )
  }, [subscriptions])

  const subscribedProductIds = useMemo(() => {
    return new Set(
      subscriptions
        .filter((sub) => sub.status === "active")
        .map((sub) => sub.product_id)
    )
  }, [subscriptions])

  // 使用 ref 存储最新的 Set，让函数保持稳定引用
  const subscribedVariantIdsRef = useRef(subscribedVariantIds)
  const subscribedProductIdsRef = useRef(subscribedProductIds)

  // 同步更新 ref
  useEffect(() => {
    subscribedVariantIdsRef.current = subscribedVariantIds
    subscribedProductIdsRef.current = subscribedProductIds
  }, [subscribedVariantIds, subscribedProductIds])

  // 检查是否订阅了某变体 - 函数引用保持稳定
  const isSubscribedToVariant = useCallback(
    (variantId: string): boolean => {
      return subscribedVariantIdsRef.current.has(variantId)
    },
    [] // 空依赖数组，函数引用永远稳定
  )

  // 检查是否订阅了某产品的任意变体 - 函数引用保持稳定
  const isSubscribedToProduct = useCallback(
    (productId: string): boolean => {
      return subscribedProductIdsRef.current.has(productId)
    },
    [] // 空依赖数组，函数引用永远稳定
  )

  // 订阅产品补货通知
  const subscribe = useCallback(
    async (data: SubscribeToRestockData) => {
      if (!isAuthenticated) {
        throw new Error("Must be logged in to subscribe")
      }

      try {
        await subscribeToRestock(data)
        // 刷新列表
        await loadSubscriptions()
      } catch (error) {
        console.error("Failed to subscribe:", error)
        throw error
      }
    },
    [isAuthenticated, loadSubscriptions]
  )

  // 取消订阅
  const unsubscribe = useCallback(
    async (subscriptionId: string) => {
      if (!isAuthenticated) {
        throw new Error("Must be logged in to unsubscribe")
      }

      try {
        await unsubscribeFromRestock(subscriptionId)
        // 刷新列表
        await loadSubscriptions()
      } catch (error) {
        console.error("Failed to unsubscribe:", error)
        throw error
      }
    },
    [isAuthenticated, loadSubscriptions]
  )

  // 切换订阅状态
  const toggleRestockSubscription = useCallback(
    async (
      product: HttpTypes.StoreProduct,
      variant: HttpTypes.StoreProductVariant,
      email: string
    ) => {
      if (!isAuthenticated) {
        throw new Error("Must be logged in to toggle subscription")
      }

      const isSubscribed = isSubscribedToVariant(variant.id)

      if (isSubscribed) {
        // 取消订阅
        const subscription = subscriptions.find(
          (sub) => sub.variant_id === variant.id && sub.status === "active"
        )
        if (subscription) {
          await unsubscribe(subscription.id)
        }
      } else {
        // 订阅
        await subscribe({
          product_id: product.id!,
          variant_id: variant.id,
          email,
        })
      }
    },
    [isAuthenticated, isSubscribedToVariant, subscriptions, subscribe, unsubscribe]
  )

  // 刷新订阅列表
  const refreshSubscriptions = useCallback(async () => {
    await loadSubscriptions()
  }, [loadSubscriptions])

  // 检查特定变体的订阅状态
  const checkSubscriptionStatus = useCallback(
    async (variantId: string): Promise<boolean> => {
      try {
        return await checkRestockSubscribed(variantId)
      } catch (error) {
        console.error("Failed to check subscription status:", error)
        return false
      }
    },
    []
  )

  const value: RestockNotifyContextValue = {
    isLoading,
    isAuthenticated,
    subscriptions,
    itemCount: subscriptions.length,
    isSubscribedToVariant,
    isSubscribedToProduct,
    toggleRestockSubscription,
    subscribe,
    unsubscribe,
    refreshSubscriptions,
    checkSubscriptionStatus,
  }

  return (
    <RestockNotifyContext.Provider value={value}>
      {children}
    </RestockNotifyContext.Provider>
  )
}

export const useRestockNotify = () => {
  const context = useContext(RestockNotifyContext)
  if (!context) {
    throw new Error(
      "useRestockNotify must be used within a RestockNotifyProvider"
    )
  }
  return context
}
