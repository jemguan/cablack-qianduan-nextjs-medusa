"use client"

import { Text } from "@medusajs/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import VariantSelector from "../product-preview/variant-selector"
import { addToCart } from "@lib/data/cart"
import { memo, useState, useMemo, useEffect, useCallback } from "react"
import Eye from "@modules/common/icons/eye"
import Image from "next/image"
import dynamic from "next/dynamic"
import { getImageUrl } from "@lib/util/image"
import ProductRating from "../reviews/ProductRating"
import WishlistButton from "@modules/wishlist/components/wishlist-button"
import type { LoyaltyAccount } from "@/types/loyalty"
import { optionsAsKeymap, findVariantByOptions } from "@lib/util/options"
import { useProductImages } from "../product-preview/hooks/useProductImages"
import { ShoppingBag, Check, Loader2 } from "lucide-react"
import { useParams } from "next/navigation"

const QuickViewModal = dynamic(() => import("../product-preview/quick-view-modal"), {
  ssr: false,
})

function SimpleAddButton({
  product,
  selectedVariant,
  onOpenQuickView,
}: {
  product: HttpTypes.StoreProduct
  selectedVariant: HttpTypes.StoreProductVariant | null
  onOpenQuickView: () => void
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const params = useParams()
  const countryCode = params?.countryCode as string

  const inStock = useMemo(() => {
    if (!selectedVariant) {
      return product.variants?.some((v) => {
        if (v.manage_inventory === false) return true
        if (v.allow_backorder === true) return true
        return (v.inventory_quantity || 0) > 0
      }) ?? false
    }
    if (selectedVariant.manage_inventory === false) return true
    if (selectedVariant.allow_backorder === true) return true
    return (selectedVariant.inventory_quantity || 0) > 0
  }, [selectedVariant, product.variants])

  const handleClick = async () => {
    // Multiple variants and none selected → open quick view
    if (!selectedVariant && product.variants && product.variants.length > 1) {
      onOpenQuickView()
      return
    }
    const variantId = selectedVariant?.id || product.variants?.[0]?.id
    if (!variantId || !inStock) return

    setIsAdding(true)
    try {
      await addToCart({ variantId, quantity: 1, countryCode })
      setIsSuccess(true)
      setTimeout(() => setIsSuccess(false), 2000)
    } catch (e) {
      console.error("Failed to add to cart:", e)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isAdding || !inStock}
      className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
        isSuccess
          ? "bg-green-600 text-white"
          : "bg-foreground text-white hover:bg-foreground/90"
      }`}
    >
      {isAdding ? (
        <Loader2 size={14} className="animate-spin" />
      ) : isSuccess ? (
        <><Check size={14} /> Added</>
      ) : (
        <><ShoppingBag size={14} /> Add</>
      )}
    </button>
  )
}

type ProductCardV2Props = {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
  priority?: boolean
  customer?: HttpTypes.StoreCustomer | null
  loyaltyAccount?: LoyaltyAccount | null
  membershipProductIds?: Record<string, boolean> | null
}

const arePropsEqual = (
  prevProps: ProductCardV2Props,
  nextProps: ProductCardV2Props
): boolean => {
  if (prevProps.product.id !== nextProps.product.id) return false
  if (prevProps.product.variants?.length !== nextProps.product.variants?.length) return false
  const prevVariants = prevProps.product.variants || []
  const nextVariants = nextProps.product.variants || []
  for (let i = 0; i < prevVariants.length; i++) {
    if (prevVariants[i].inventory_quantity !== nextVariants[i].inventory_quantity) return false
    if (prevVariants[i].manage_inventory !== nextVariants[i].manage_inventory) return false
    if (prevVariants[i].allow_backorder !== nextVariants[i].allow_backorder) return false
  }
  if (prevProps.region.id !== nextProps.region.id) return false
  if (prevProps.priority !== nextProps.priority) return false
  if (prevProps.customer?.id !== nextProps.customer?.id) return false
  const prevLoyalty = prevProps.loyaltyAccount
  const nextLoyalty = nextProps.loyaltyAccount
  if (prevLoyalty?.is_member !== nextLoyalty?.is_member) return false
  if (prevLoyalty?.membership_expires_at !== nextLoyalty?.membership_expires_at) return false
  const prevMemberIds = prevProps.membershipProductIds
  const nextMemberIds = nextProps.membershipProductIds
  if (prevMemberIds !== nextMemberIds) {
    if (prevMemberIds && nextMemberIds) {
      const prevKeys = Object.keys(prevMemberIds)
      const nextKeys = Object.keys(nextMemberIds)
      if (prevKeys.length !== nextKeys.length) return false
      for (const key of prevKeys) {
        if (prevMemberIds[key] !== nextMemberIds[key]) return false
      }
    } else {
      return false
    }
  }
  return true
}

const ProductCardV2 = memo(function ProductCardV2({
  product,
  isFeatured: _isFeatured,
  region,
  priority = false,
  customer,
  loyaltyAccount,
  membershipProductIds,
}: ProductCardV2Props) {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
  const [options, setOptions] = useState<Record<string, string | undefined>>({})

  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    return findVariantByOptions(product.variants, options)
  }, [product.variants, options])

  const selectedVariantPrice = selectedVariant
    ? getProductPrice({ product, variantId: selectedVariant.id }).variantPrice
    : null
  const cheapestPrice = getProductPrice({ product }).cheapestPrice
  const displayPrice = selectedVariantPrice || cheapestPrice

  const handleOptionChange = useCallback((optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }, [])

  const displayImages = useProductImages(product, selectedVariant)

  const isOnSale = displayPrice?.price_type === "sale"
  const discountPercentage = displayPrice?.percentage_diff

  // Get category from product
  const categoryName = product.categories?.[0]?.name || product.collection?.title || ""

  return (
    <>
      <div className="group relative flex flex-col h-full rounded-3xl bg-card border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        {/* Image Area */}
        <div className="relative aspect-square w-full overflow-hidden bg-secondary">
          <LocalizedClientLink
            href={`/products/${product.handle}`}
            className="absolute inset-0 z-10"
            aria-label={`View ${product.title}`}
          />

          {displayImages.length > 0 && displayImages[0]?.url && (() => {
            const firstImageUrl = getImageUrl(displayImages[0].url || '')
            if (!firstImageUrl) return null
            return (
              <Image
                src={firstImageUrl}
                alt={product.title || "Product"}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading={priority ? "eager" : "lazy"}
                priority={priority}
                quality={85}
              />
            )
          })()}

          {/* Badge: only show discount % when on sale */}
          {isOnSale && discountPercentage && (
            <div className="absolute top-4 left-4 z-20">
              <span className="inline-flex items-center rounded-full bg-foreground text-white text-[11px] font-semibold tracking-wider px-3.5 py-1.5">
                -{discountPercentage}%
              </span>
            </div>
          )}

          {/* Wishlist Button */}
          <div className="absolute top-4 right-4 z-20">
            <WishlistButton product={product} size="sm" overlay />
          </div>

          {/* Quick View - Desktop Hover */}
          <div className="hidden small:flex absolute inset-0 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsQuickViewOpen(true)
              }}
              className="bg-background/95 backdrop-blur-md text-foreground p-3 rounded-full shadow-xl hover:bg-background transition-all duration-200 hover:scale-110 pointer-events-auto border border-border/50"
              aria-label="Quick view"
            >
              <Eye size="20" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-col gap-2.5 p-4">
          {/* Row 1: Category + Rating */}
          <div className="flex items-center justify-between">
            {categoryName ? (
              <span className="text-[11px] font-semibold tracking-widest text-primary uppercase">
                {categoryName}
              </span>
            ) : <span />}
            <div className="flex-shrink-0">
              <ProductRating productId={product.id} size="sm" showCount={true} />
            </div>
          </div>

          {/* Row 2: Title - fixed 2 lines */}
          <LocalizedClientLink href={`/products/${product.handle}`}>
            <Text
              className="text-[15px] font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors duration-200 leading-snug h-[2.5rem]"
              data-testid="product-title"
            >
              {product.title}
            </Text>
          </LocalizedClientLink>

          {/* Row 3: Description - fixed 1 line */}
          <Text className="text-xs text-muted-foreground leading-normal line-clamp-1 h-4">
            {product.subtitle || product.description?.slice(0, 60) || "\u00A0"}
          </Text>

          {/* Row 4: Variant Selector */}
          {product.variants && product.variants.length > 1 && product.options && product.options.length > 0 && (
            <VariantSelector
              product={product}
              options={options}
              onOptionChange={handleOptionChange}
              compact={true}
            />
          )}

          {/* Row 5: Price + Add Button - fixed height */}
          <div className="flex items-center justify-between gap-2 h-14 small:h-12 mt-1">
            <div className="flex flex-col">
              {displayPrice && (
                <>
                  {displayPrice.price_type === "sale" &&
                    displayPrice.original_price_number > displayPrice.calculated_price_number && (
                    <span className="text-[11px] text-muted-foreground line-through leading-none">
                      {displayPrice.original_price}
                    </span>
                  )}
                  <span className={`text-base font-bold leading-none ${displayPrice.price_type === "sale" ? "text-primary" : "text-foreground"}`}>
                    {displayPrice.calculated_price}
                  </span>
                </>
              )}
            </div>
            <SimpleAddButton
              product={product}
              selectedVariant={selectedVariant}
              onOpenQuickView={() => setIsQuickViewOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={product}
        region={region}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        customer={customer}
        loyaltyAccount={loyaltyAccount}
        membershipProductIds={membershipProductIds}
      />
    </>
  )
}, arePropsEqual)

export default ProductCardV2
