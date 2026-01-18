"use client"

import { useRestockNotify } from "@lib/context/restock-notify-context"
import { useState, useEffect, useMemo } from "react"
import { Button, Heading, Text } from "@medusajs/ui"
import Link from "next/link"
import { Bell, Trash2, AlertCircle, ShoppingCart } from "lucide-react"
import clsx from "clsx"
import Image from "next/image"
import { listProducts } from "@lib/data/products"
import { addToCart } from "@lib/data/cart"
import { getRegion } from "@lib/data/regions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { triggerRestockCheck } from "@lib/data/restock-subscriptions"

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
  const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null)
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false)
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
      const uniqueProductIds = Array.from(new Set(subscriptions.map((s) => s.product_id)))

      if (uniqueProductIds.length > 0) {
        const { response } = await listProducts({
          queryParams: {
            id: uniqueProductIds,
            limit: uniqueProductIds.length,
            fields: "id,title,thumbnail,handle,*variants.title",
          },
        })

      const productMap: Record<string, any> = {}
        response.products?.forEach((product) => {
          productMap[product.id] = product
        })

      setProductData(productMap)
      }
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

  const handleAddToCart = async (subscription: (typeof subscriptions)[0], product: any) => {
    if (!product?.variants?.[0]?.id) return

    setIsAddingToCart(subscription.id)
    try {
      await addToCart({
        variantId: product.variants[0].id,
        quantity: 1,
      })
      // 取消订阅，因为产品已经被添加到购物车
      await unsubscribe(subscription.id)
      await refreshSubscriptions()
    } catch (error) {
      console.error("Failed to add to cart:", error)
    } finally {
      setIsAddingToCart(null)
    }
  }

  const handleRefreshStatus = async () => {
    setIsRefreshingStatus(true)
    try {
      // 手动触发后端补货检查
      const result = await triggerRestockCheck()
      console.log('Restock check result:', result)
      // 刷新前端订阅状态
      await refreshSubscriptions()
      // 重新加载产品数据以获取最新状态
      await loadProductData()
    } catch (error) {
      console.error('Error refreshing restock status:', error)
    } finally {
      setIsRefreshingStatus(false)
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
        label: "Purchased",
        color: "text-green-700 bg-green-50",
        icon: <AlertCircle size={14} />,
      }
    }

    if (item.last_restocked_at) {
      const restockDate = formatDate(item.last_restocked_at)
      return {
        label: `Restocked on ${restockDate}`,
        color: "text-blue-700 bg-blue-50",
        icon: <Bell size={14} />,
      }
    }

    return {
      label: "Waiting for Restock",
      color: "text-amber-700 bg-amber-50",
      icon: <AlertCircle size={14} />,
    }
  }

  const getProductPrice = (product: any) => {
    if (!product?.variants?.[0]?.calculated_price) return null
    const price = product.variants[0].calculated_price
    return {
      amount: price.calculated_amount,
      currency_code: price.calculated_currency_code || price.currency_code,
      original_amount: price.original_amount,
      is_on_sale: price.calculated_amount < price.original_amount,
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
      <div className="mb-6 small:mb-8">
        <div className="flex items-center justify-between mb-2 gap-2">
          <Heading level="h1" className="text-xl small:text-2xl font-bold">
            <span className="hidden small:inline">📬 My Restock Notifications</span>
            <span className="small:hidden">📬 Notifications</span>
          </Heading>
          <button
            onClick={handleRefreshStatus}
            disabled={isRefreshingStatus}
            className="px-3 small:px-4 py-2 text-xs small:text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 small:gap-2 flex-shrink-0"
          >
            {isRefreshingStatus ? (
              <>
                <div className="w-3 h-3 small:w-4 small:h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                <span className="hidden small:inline">Refreshing...</span>
              </>
            ) : (
              <>
                🔄 <span className="hidden small:inline">Refresh</span>
              </>
            )}
          </button>
        </div>
        <Text className="text-ui-fg-subtle text-sm small:text-base hidden small:block">
          {subscriptions.length === 0
            ? "You haven't subscribed to any restock notifications yet"
            : `You are watching ${groupedByStatus.active.length} product(s) for restock`}
        </Text>
      </div>

      {/* Empty State */}
      {isLoaded && subscriptions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 small:py-16 border border-dashed border-ui-border-base rounded-lg bg-ui-bg-subtle">
          <Bell size={40} className="text-ui-fg-muted mb-3 small:mb-4" />
          <Heading level="h2" className="text-base small:text-lg font-semibold mb-2">
            No Subscriptions
          </Heading>
          <Text className="text-ui-fg-subtle mb-4 small:mb-6 text-center max-w-md text-sm small:text-base px-4">
            <span className="hidden small:inline">When you see a "Notify Me" button on a product page, you can subscribe to restock notifications. We'll email you when the product is back in stock.</span>
            <span className="small:hidden">Click "Notify Me" on products to get restock alerts.</span>
          </Text>
          <Link href="/store">
            <Button variant="primary">Browse Products</Button>
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
            <Text className="mt-4 text-ui-fg-subtle">Loading...</Text>
          </div>
        </div>
      )}

      {/* Active Subscriptions */}
      {isLoaded && groupedByStatus.active.length > 0 && (
        <div className="mb-8 small:mb-12">
          <div className="mb-3 small:mb-4">
            <Heading level="h2" className="text-base small:text-lg font-semibold">
            Watching ({groupedByStatus.active.length})
          </Heading>
            <p className="text-xs small:text-sm text-muted-foreground hidden small:block">
              We'll notify you by email when these products are back in stock
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 small:gap-4">
            {groupedByStatus.active.map((subscription) => {
              const product = productData[subscription.product_id]
              const statusInfo = getSubscriptionStatus(subscription)

              return (
                <div
                  key={subscription.id}
                  className="rounded-lg border p-3 small:p-4 transition-all bg-card hover:border-primary/50 hover:shadow-sm"
                >
                  {/* Mobile: Horizontal Layout with image on left, Desktop: Horizontal Layout */}
                  <div className="flex flex-row gap-3 small:gap-4">
                    {/* Product Image - Clickable link to product page */}
                    <LocalizedClientLink
                      href={`/products/${product?.handle || subscription.product_id}`}
                      className="w-24 small:w-20 h-24 small:h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity block"
                      aria-label={`View ${product?.title || "product"} details`}
                    >
                      {product?.thumbnail ? (
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                        </div>
                      )}
                    </LocalizedClientLink>

                      {/* Product Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <Link
                          href={`/products/${product?.handle || subscription.product_id}`}
                          className="block group"
                        >
                          <h4 className="font-medium text-sm small:text-base line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                            {product?.title || "Product"}
                          </h4>
                        </Link>
                        {(subscription as any).variant_title && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                            {(subscription as any).variant_title}
                          </p>
                        )}

                        {/* Price */}
                        {(() => {
                          const price = getProductPrice(product)
                          return price ? (
                            <div className="mb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-primary font-bold text-base small:text-lg">
                                  ${price.amount.toFixed(2)}
                                </span>
                                {price.is_on_sale && price.original_amount && (
                                  <span className="text-xs text-muted-foreground line-through">
                                    ${price.original_amount.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : null
                        })()}

                        <div className="flex flex-col gap-2">
                        {/* Status Badge */}
                          <div className={clsx("inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded w-fit", statusInfo.color)}>
                          {statusInfo.icon}
                          {statusInfo.label}
                          </div>
                          {subscription.notification_count > 0 && (
                            <Text className="text-xs text-muted-foreground">
                              Notified {subscription.notification_count} time(s)
                            </Text>
                          )}
                        </div>
                        </div>

                        {/* Subscription Date */}
                      <Text className="text-xs text-muted-foreground mt-2">
                          Subscribed on {formatDate(subscription.created_at)}
                        </Text>
                    </div>
                  </div>

                  {/* Action Button - Add to Cart if restocked, Unsubscribe if waiting */}
                  {subscription.last_restocked_at ? (
                    // Product is restocked - show Add to Cart button
                    <Button
                      onClick={() => handleAddToCart(subscription, product)}
                      disabled={isAddingToCart === subscription.id}
                      variant="primary"
                      className="w-full mt-3 small:mt-4 h-10 text-white border-none !border-2 !shadow-none bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 !border-orange-600 hover:!border-orange-700 dark:!border-orange-600 dark:hover:!border-orange-700 disabled:bg-ui-bg-disabled disabled:hover:bg-ui-bg-disabled disabled:!border-ui-border-base disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ borderColor: 'rgb(234 88 12)', borderWidth: '2px', borderStyle: 'solid' }}
                      isLoading={isAddingToCart === subscription.id}
                      data-testid="add-to-cart-button"
                    >
                      {isAddingToCart === subscription.id ? (
                        "Adding..."
                      ) : (
                        <>
                          <ShoppingCart size={16} />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  ) : (
                    // Product is waiting for restock - show Unsubscribe button
                  <button
                    onClick={() => handleUnsubscribe(subscription.id)}
                    disabled={isUnsubscribing === subscription.id}
                      className="w-full mt-3 small:mt-4 py-2.5 small:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 border border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={
                        isUnsubscribing === subscription.id
                          ? "Unsubscribing"
                          : `Unsubscribe from ${product?.title || "product"}`
                      }
                    >
                      {isUnsubscribing === subscription.id
                        ? "Unsubscribing..."
                        : "Unsubscribe"}
                  </button>
                  )}
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
            Purchased ({groupedByStatus.purchased.length})
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
                            {product?.title || "Product"}
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
                    title="Remove"
                  >
                    <Trash2 size={18} className="text-ui-fg-muted hover:text-ui-fg-error" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Help Text - Hidden on mobile */}
      {isLoaded && subscriptions.length > 0 && (
        <div className="mt-6 small:mt-8 p-3 small:p-4 bg-ui-bg-subtle border border-ui-border-base rounded-lg hidden small:block">
          <Text className="text-xs small:text-sm text-ui-fg-subtle">
            💡 <strong>Tip:</strong> When you purchase a subscribed product, the subscription is automatically marked as "Purchased". You can remove notifications from the list at any time.
          </Text>
        </div>
      )}
    </div>
  )
}
