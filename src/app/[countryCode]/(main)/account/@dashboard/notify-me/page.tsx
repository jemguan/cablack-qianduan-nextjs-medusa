"use client"

import { useMemo } from "react"
import { Heading } from "@medusajs/ui"
import { useRestockNotify } from "@lib/context/restock-notify-context"

import { useProductData, useSubscriptionActions } from "./hooks"
import {
  EmptyState,
  LoadingState,
  PageHeader,
  ActiveSubscriptionCard,
  PurchasedSubscriptionCard,
  HelpTip,
} from "./components"
import { getSubscriptionStatus, groupSubscriptionsByStatus } from "./utils"
import type { RestockItem } from "./types"

export default function NotifyMePage() {
  const { subscriptions, unsubscribe, isLoading, refreshSubscriptions } =
    useRestockNotify()

  const { productData, isFetchingProductData, reloadProductData } =
    useProductData(subscriptions as RestockItem[])

  const {
    isUnsubscribing,
    isAddingToCart,
    isRefreshingStatus,
    handleUnsubscribe,
    handleAddToCart,
    handleRefreshStatus,
  } = useSubscriptionActions({
    unsubscribe,
    refreshSubscriptions,
    reloadProductData,
  })

  const groupedByStatus = useMemo(
    () => groupSubscriptionsByStatus(subscriptions as RestockItem[]),
    [subscriptions]
  )

  const isLoaded = !isLoading && !isFetchingProductData

  return (
    <div className="w-full">
      <PageHeader
        activeCount={groupedByStatus.active.length}
        totalCount={subscriptions.length}
        isRefreshing={isRefreshingStatus}
        onRefresh={handleRefreshStatus}
      />

      {/* Empty State */}
      {isLoaded && subscriptions.length === 0 && <EmptyState />}

      {/* Loading State */}
      {!isLoaded && <LoadingState />}

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
                <ActiveSubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  product={product}
                  statusInfo={statusInfo}
                  isUnsubscribing={isUnsubscribing === subscription.id}
                  isAddingToCart={isAddingToCart === subscription.id}
                  onUnsubscribe={handleUnsubscribe}
                  onAddToCart={handleAddToCart}
                />
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
                <PurchasedSubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  product={product}
                  statusInfo={statusInfo}
                  isUnsubscribing={isUnsubscribing === subscription.id}
                  onUnsubscribe={handleUnsubscribe}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Help Text */}
      {isLoaded && subscriptions.length > 0 && <HelpTip />}
    </div>
  )
}
