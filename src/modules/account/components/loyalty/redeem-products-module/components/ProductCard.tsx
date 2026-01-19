"use client"

import clsx from "clsx"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ProductImage } from "./ProductImage"
import type { ProductCardProps } from "../types"

/**
 * 产品卡片组件
 */
export function ProductCard({
  rule,
  canAfford,
  inStock,
  isSelected,
  isLoading,
  productHandle,
  onRedeem,
}: ProductCardProps) {
  const canRedeem = canAfford && inStock
  const productUrl = productHandle ? `/products/${productHandle}` : null

  const renderImage = () => {
    const imageContent = (
      <ProductImage
        src={rule.product_thumbnail || null}
        alt={rule.product_title || "Product"}
        size="medium"
      />
    )

    if (productUrl) {
      return (
        <LocalizedClientLink
          href={productUrl}
          className="cursor-pointer hover:opacity-90 transition-opacity"
          aria-label={`View ${rule.product_title || "product"} details`}
        >
          {imageContent}
        </LocalizedClientLink>
      )
    }

    return imageContent
  }

  const renderTitle = () => {
    const titleContent = (
      <h4 className="font-medium text-sm small:text-base line-clamp-2 mb-1 group-hover:text-primary transition-colors">
        {rule.product_title || "Unknown Product"}
      </h4>
    )

    if (productUrl) {
      return (
        <LocalizedClientLink href={productUrl} className="block group">
          {titleContent}
        </LocalizedClientLink>
      )
    }

    return (
      <h4 className="font-medium text-sm small:text-base line-clamp-2 mb-1">
        {rule.product_title || "Unknown Product"}
      </h4>
    )
  }

  return (
    <div
      className={clsx(
        "rounded-lg border p-3 small:p-4 transition-all relative bg-card",
        canRedeem
          ? "border-border/50 hover:border-primary/50 hover:shadow-sm"
          : "border-border/50 opacity-60"
      )}
    >
      <div className="flex flex-row gap-3 small:gap-4">
        {renderImage()}

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {renderTitle()}
            {rule.variant_title && (
              <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                {rule.variant_title}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-primary font-bold text-base small:text-lg">
                {rule.required_points.toLocaleString()} pts
              </span>
              {rule.daily_limit && (
                <span className="text-xs text-muted-foreground">
                  Limit {rule.daily_limit}/day
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => onRedeem(rule)}
        disabled={!canRedeem || isLoading}
        className={clsx(
          "w-full mt-3 small:mt-4 py-2.5 small:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          canRedeem && !isLoading
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
        aria-label={
          isSelected && isLoading
            ? "Redeeming product"
            : canAfford
              ? `Redeem ${rule.product_title} for ${rule.required_points} points`
              : `Not enough points to redeem ${rule.product_title}`
        }
      >
        {isSelected && isLoading
          ? "Redeeming..."
          : canAfford
            ? "Redeem Now"
            : "Not Enough Points"}
      </button>
    </div>
  )
}
