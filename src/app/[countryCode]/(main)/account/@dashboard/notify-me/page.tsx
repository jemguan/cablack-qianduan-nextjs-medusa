"use client"

import { useRestockNotify } from "@lib/context/restock-notify-context"
import { useState, useEffect, useMemo } from "react"
import { Button, Heading, Text } from "@medusajs/ui"
import Link from "next/link"
import { Bell, Trash2, AlertCircle } from "lucide-react"
import clsx from "clsx"

interface RestockItem {
  id: string
  product_id: string
  variant_id: string
  product_title?: string
  variant_title?: string
  status: "active" | "purchased"
  last_restocked_at?: string | null
  last_notified_at?: string | null
  notification_count: number
  created_at: string
}

export default function NotifyMePage() {
  const { subscriptions, unsubscribe, isLoading, refreshSubscriptions } = useRestockNotify()
  const [isUnsubscribing, setIsUnsubscribing] = useState<string | null>(null)
  const [productData, setProductData] = useState<Record<string, any>>({})
  const [isFetchingProductData, setIsFetchingProductData] = useState(true)

  // Load product data on mount
  useEffect(() => {
    loadProductData()
  }, [subscriptions])

  const loadProductData = async () => {
    if (subscriptions.length === 0) {
      setIsFetchingProductData(false)
      return
    }

    setIsFetchingProductData(true)
    try {
      // 获取所有订阅的产品数据
      const uniqueProductIds = [...new Set(subscriptions.map((s) => s.product_id))]
      const productMap: Record<string, any> = {}

      for (const productId of uniqueProductIds) {
        try {
          const response = await fetch(`/api/products/${productId}`)
          if (response.ok) {
            const data = await response.json()
            productMap[productId] = data
          }
        } catch (error) {
          console.error(`Failed to fetch product ${productId}:`, error)
        }
      }

      setProductData(productMap)
    } catch (error) {
      console.error("Failed to load product data:", error)
    } finally {
      setIsFetchingProductData(false)
    }
  }

  const handleUnsubscribe = async (subscriptionId: string) => {
    setIsUnsubscribing(subscriptionId)
    try {
      await unsubscribe(subscriptionId)
    } catch (error) {
      console.error("Failed to unsubscribe:", error)
    } finally {
      setIsUnsubscribing(null)
    }
  }

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return ""
    }
  }

  const getSubscriptionStatus = (
    item: (typeof subscriptions)[0]
  ): { label: string; color: string; icon: React.ReactNode } => {
    if (item.status === "purchased") {
      return {
        label: "已购买",
        color: "text-green-700 bg-green-50",
        icon: <AlertCircle size={14} />,
      }
    }

    if (item.last_restocked_at) {
      const restockDate = formatDate(item.last_restocked_at)
      return {
        label: `已于 ${restockDate} 补货`,
        color: "text-blue-700 bg-blue-50",
        icon: <Bell size={14} />,
      }
    }

    return {
      label: "等待补货",
      color: "text-amber-700 bg-amber-50",
      icon: <AlertCircle size={14} />,
    }
  }

  const groupedByStatus = useMemo(() => {
    return {
      active: subscriptions.filter((s) => s.status === "active"),
      purchased: subscriptions.filter((s) => s.status === "purchased"),
    }
  }, [subscriptions])

  const isLoaded = !isLoading && !isFetchingProductData

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <Heading level="h1" className="text-2xl font-bold mb-2">
          📬 我的缺货通知
        </Heading>
        <Text className="text-ui-fg-subtle">
          {subscriptions.length === 0
            ? "您还没有订阅任何产品的缺货通知"
            : `您正在关注 ${groupedByStatus.active.length} 个产品的补货`}
        </Text>
      </div>

      {/* Empty State */}
      {isLoaded && subscriptions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-ui-border-base rounded-lg bg-ui-bg-subtle">
          <Bell size={48} className="text-ui-fg-muted mb-4" />
          <Heading level="h2" className="text-lg font-semibold mb-2">
            还没有通知订阅
          </Heading>
          <Text className="text-ui-fg-subtle mb-6 text-center max-w-md">
            当您在产品页面看到"Notify Me"按钮时，可以订阅缺货通知。我们会在产品补货时发送邮件给您。
          </Text>
          <Link href="/store">
            <Button variant="primary">浏览产品</Button>
          </Link>
        </div>
      )}

      {/* Loading State */}
      {!isLoaded && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin">
              <Bell className="text-ui-fg-muted" />
            </div>
            <Text className="mt-4 text-ui-fg-subtle">加载中...</Text>
          </div>
        </div>
      )}

      {/* Active Subscriptions */}
      {isLoaded && groupedByStatus.active.length > 0 && (
        <div className="mb-12">
          <Heading level="h2" className="text-lg font-semibold mb-4">
            关注中 ({groupedByStatus.active.length})
          </Heading>
          <div className="grid gap-4">
            {groupedByStatus.active.map((subscription) => {
              const product = productData[subscription.product_id]
              const statusInfo = getSubscriptionStatus(subscription)

              return (
                <div
                  key={subscription.id}
                  className="flex items-center justify-between p-4 border border-ui-border-base rounded-lg hover:bg-ui-bg-subtle transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      {/* Product Image */}
                      {product?.thumbnail && (
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      )}

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${product?.handle || subscription.product_id}`}>
                          <h3 className="font-semibold text-ui-fg-base hover:text-ui-fg-interactive truncate">
                            {product?.title || "产品"}
                          </h3>
                        </Link>
                        {subscription.notification_count > 0 && (
                          <Text className="text-sm text-ui-fg-subtle mt-1">
                            已通知 {subscription.notification_count} 次
                          </Text>
                        )}

                        {/* Status Badge */}
                        <div className={clsx("inline-flex items-center gap-1 text-xs font-medium mt-2 px-2 py-1 rounded", statusInfo.color)}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </div>

                        {/* Subscription Date */}
                        <Text className="text-xs text-ui-fg-subtle mt-2">
                          订阅于 {formatDate(subscription.created_at)}
                        </Text>
                      </div>
                    </div>
                  </div>

                  {/* Unsubscribe Button */}
                  <button
                    onClick={() => handleUnsubscribe(subscription.id)}
                    disabled={isUnsubscribing === subscription.id}
                    className="ml-4 p-2 hover:bg-ui-bg-base rounded-lg transition-colors disabled:opacity-50"
                    title="取消订阅"
                  >
                    <Trash2 size={18} className="text-ui-fg-muted hover:text-ui-fg-error" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Purchased Subscriptions */}
      {isLoaded && groupedByStatus.purchased.length > 0 && (
        <div className="mb-12">
          <Heading level="h2" className="text-lg font-semibold mb-4">
            已购买 ({groupedByStatus.purchased.length})
          </Heading>
          <div className="grid gap-4">
            {groupedByStatus.purchased.map((subscription) => {
              const product = productData[subscription.product_id]
              const statusInfo = getSubscriptionStatus(subscription)

              return (
                <div
                  key={subscription.id}
                  className="flex items-center justify-between p-4 border border-ui-border-base rounded-lg bg-ui-bg-subtle opacity-75"
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      {/* Product Image */}
                      {product?.thumbnail && (
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      )}

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${product?.handle || subscription.product_id}`}>
                          <h3 className="font-semibold text-ui-fg-base hover:text-ui-fg-interactive truncate">
                            {product?.title || "产品"}
                          </h3>
                        </Link>

                        {/* Status Badge */}
                        <div className={clsx("inline-flex items-center gap-1 text-xs font-medium mt-2 px-2 py-1 rounded", statusInfo.color)}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleUnsubscribe(subscription.id)}
                    disabled={isUnsubscribing === subscription.id}
                    className="ml-4 p-2 hover:bg-ui-bg-base rounded-lg transition-colors disabled:opacity-50"
                    title="移除"
                  >
                    <Trash2 size={18} className="text-ui-fg-muted hover:text-ui-fg-error" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Help Text */}
      {isLoaded && subscriptions.length > 0 && (
        <div className="mt-8 p-4 bg-ui-bg-subtle border border-ui-border-base rounded-lg">
          <Text className="text-sm text-ui-fg-subtle">
            💡 <strong>提示：</strong> 当您购买已订阅的产品时，该订阅会自动标记为"已购买"。您可以随时从列表中删除通知。
          </Text>
        </div>
      )}
    </div>
  )
}
