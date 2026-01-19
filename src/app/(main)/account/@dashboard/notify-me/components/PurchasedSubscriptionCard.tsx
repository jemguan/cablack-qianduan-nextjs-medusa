"use client"

import Link from "next/link"
import { Trash2 } from "lucide-react"
import clsx from "clsx"
import type { PurchasedCardProps } from "../types"

/**
 * 已购买订阅卡片组件
 */
export function PurchasedSubscriptionCard({
  subscription,
  product,
  statusInfo,
  isUnsubscribing,
  onUnsubscribe,
}: PurchasedCardProps) {
  return (
    <div className="flex items-center justify-between p-4 border border-ui-border-base rounded-lg bg-ui-bg-subtle opacity-75">
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
            <Link
              href={`/products/${product?.handle || subscription.product_id}`}
            >
              <h3 className="font-semibold text-ui-fg-base hover:text-ui-fg-interactive truncate">
                {product?.title || "Product"}
              </h3>
            </Link>

            {/* Status Badge */}
            <div
              className={clsx(
                "inline-flex items-center gap-1 text-xs font-medium mt-2 px-2 py-1 rounded",
                statusInfo.color
              )}
            >
              {statusInfo.icon}
              {statusInfo.label}
            </div>
          </div>
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onUnsubscribe(subscription.id)}
        disabled={isUnsubscribing}
        className="ml-4 p-2 hover:bg-ui-bg-base rounded-lg transition-colors disabled:opacity-50"
        title="Remove"
      >
        <Trash2
          size={18}
          className="text-ui-fg-muted hover:text-ui-fg-error"
        />
      </button>
    </div>
  )
}
