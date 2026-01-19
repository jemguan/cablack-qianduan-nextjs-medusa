"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { Button, Text } from "@medusajs/ui"
import clsx from "clsx"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { formatDate, getProductPrice } from "../utils"
import type { SubscriptionCardProps } from "../types"

/**
 * 活跃订阅卡片组件
 */
export function ActiveSubscriptionCard({
  subscription,
  product,
  statusInfo,
  isUnsubscribing,
  isAddingToCart,
  onUnsubscribe,
  onAddToCart,
}: SubscriptionCardProps) {
  const price = getProductPrice(product)

  return (
    <div className="rounded-lg border p-3 small:p-4 transition-all bg-card hover:border-primary/50 hover:shadow-sm">
      <div className="flex flex-row gap-3 small:gap-4">
        {/* Product Image */}
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
            {price && (
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
            )}

            <div className="flex flex-col gap-2">
              {/* Status Badge */}
              <div
                className={clsx(
                  "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded w-fit",
                  statusInfo.color
                )}
              >
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

      {/* Action Button */}
      {subscription.last_restocked_at ? (
        <Button
          onClick={() => onAddToCart(subscription, product)}
          disabled={isAddingToCart}
          variant="primary"
          className="w-full mt-3 small:mt-4 h-10 text-white border-none !border-2 !shadow-none bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 !border-orange-600 hover:!border-orange-700 dark:!border-orange-600 dark:hover:!border-orange-700 disabled:bg-ui-bg-disabled disabled:hover:bg-ui-bg-disabled disabled:!border-ui-border-base disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            borderColor: "rgb(234 88 12)",
            borderWidth: "2px",
            borderStyle: "solid",
          }}
          isLoading={isAddingToCart}
          data-testid="add-to-cart-button"
        >
          {isAddingToCart ? (
            "Adding..."
          ) : (
            <>
              <ShoppingCart size={16} />
              Add to Cart
            </>
          )}
        </Button>
      ) : (
        <button
          onClick={() => onUnsubscribe(subscription.id)}
          disabled={isUnsubscribing}
          className="w-full mt-3 small:mt-4 py-2.5 small:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 border border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={
            isUnsubscribing
              ? "Unsubscribing"
              : `Unsubscribe from ${product?.title || "product"}`
          }
        >
          {isUnsubscribing ? "Unsubscribing..." : "Unsubscribe"}
        </button>
      )}
    </div>
  )
}
