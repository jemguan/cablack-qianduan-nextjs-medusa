"use client"

import { Text } from "@medusajs/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PreviewPriceClient from "./preview-price-client"
import VariantSelector from "./variant-selector"
import QuickAddButton from "./quick-add-button"
import { memo, useState, useMemo, useEffect, useCallback } from "react"
import Eye from "@modules/common/icons/eye"
import Image from "next/image"
import dynamic from "next/dynamic"
import { getImageUrl } from "@lib/util/image"
import ProductRating from "../reviews/ProductRating"
import WishlistButton from "@modules/wishlist/components/wishlist-button"
import type { LoyaltyAccount } from "@/types/loyalty"
import { optionsAsKeymap, findVariantByOptions } from "@lib/util/options"
import { useProductImages } from "./hooks/useProductImages"

// 动态导入 QuickViewModal，仅在需要时加载（减少初始 JS 包大小）
const QuickViewModal = dynamic(() => import("./quick-view-modal"), {
  ssr: false,
})

type ProductPreviewProps = {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
  priority?: boolean // 是否优先加载图片（用于首屏产品）
  /** 当前登录的客户 */
  customer?: HttpTypes.StoreCustomer | null
  /** 积分账户信息 */
  loyaltyAccount?: LoyaltyAccount | null
  /** 会员产品 ID 列表 */
  membershipProductIds?: Record<string, boolean> | null
}

// 自定义 memo 比较函数，避免因对象引用变化导致不必要的重渲染
// 这解决了当 cart 缓存失效时，整个产品列表按钮闪烁的问题
const arePropsEqual = (
  prevProps: ProductPreviewProps,
  nextProps: ProductPreviewProps
): boolean => {
  // 比较 product id 和 variants
  if (prevProps.product.id !== nextProps.product.id) return false
  if (prevProps.product.variants?.length !== nextProps.product.variants?.length) return false

  // 比较 variants 的库存状态（这会影响按钮显示）
  const prevVariants = prevProps.product.variants || []
  const nextVariants = nextProps.product.variants || []
  for (let i = 0; i < prevVariants.length; i++) {
    if (prevVariants[i].inventory_quantity !== nextVariants[i].inventory_quantity) return false
    if (prevVariants[i].manage_inventory !== nextVariants[i].manage_inventory) return false
    if (prevVariants[i].allow_backorder !== nextVariants[i].allow_backorder) return false
  }

  // 比较 region id
  if (prevProps.region.id !== nextProps.region.id) return false

  // 比较 priority（会影响图片加载）
  if (prevProps.priority !== nextProps.priority) return false

  // 比较 customer id（影响登录状态和会员产品按钮）
  if (prevProps.customer?.id !== nextProps.customer?.id) return false

  // 比较 loyaltyAccount 关键字段（影响 VIP 状态）
  const prevLoyalty = prevProps.loyaltyAccount
  const nextLoyalty = nextProps.loyaltyAccount
  if (prevLoyalty?.is_member !== nextLoyalty?.is_member) return false
  if (prevLoyalty?.membership_expires_at !== nextLoyalty?.membership_expires_at) return false

  // 比较 membershipProductIds（影响会员产品判断）
  const prevMemberIds = prevProps.membershipProductIds
  const nextMemberIds = nextProps.membershipProductIds
  if (prevMemberIds !== nextMemberIds) {
    // 只有当两者都存在且不同时才检查
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

const ProductPreview = memo(function ProductPreview({
  product,
  isFeatured: _isFeatured,
  region,
  priority = false,
  customer,
  loyaltyAccount,
  membershipProductIds,
}: ProductPreviewProps) {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
  const [options, setOptions] = useState<Record<string, string | undefined>>({})

  // Initialize options if product has only one variant
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    return findVariantByOptions(product.variants, options)
  }, [product.variants, options])

  // 获取选中变体的价格，如果没有选中则获取最便宜的价格
  const selectedVariantPrice = selectedVariant
    ? getProductPrice({ product, variantId: selectedVariant.id }).variantPrice
    : null
  const cheapestPrice = getProductPrice({ product }).cheapestPrice
  const displayPrice = selectedVariantPrice || cheapestPrice

  // 使用 useCallback 优化事件处理函数，避免子组件不必要的重渲染
  const handleOptionChange = useCallback((optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }, [])

  // 使用自定义 hook 获取展示图片
  const displayImages = useProductImages(product, selectedVariant)

  // Check if product is on sale (use selected variant price if available, otherwise cheapest)
  const isOnSale = displayPrice?.price_type === "sale"
  const discountPercentage = displayPrice?.percentage_diff

  return (
    <>
      <div className="group relative flex flex-col h-full transition-all duration-300 hover:shadow-lg rounded-lg p-2 hover:-translate-y-1">
        {/* Image Container */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-ui-bg-subtle mb-3 shadow-md group-hover:shadow-xl transition-shadow duration-300">
          <LocalizedClientLink 
            href={`/products/${product.handle}`}
            className="absolute inset-0 z-10"
            aria-label={`View ${product.title}`}
          />
          
          {/* Product Image */}
          {displayImages.length > 0 && displayImages[0]?.url && (() => {
            const firstImageUrl = getImageUrl(displayImages[0].url || '')
            if (!firstImageUrl) return null
            return (
              <div className="relative w-full h-full">
                <Image
                  src={firstImageUrl}
                  alt={product.title || "Product"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  loading={priority ? "eager" : "lazy"}
                  priority={priority}
                  quality={85}
                />
              </div>
            )
          })()}

          {/* Badges */}
          <div className="absolute top-0 left-0 flex flex-col gap-0 z-20">
            {isOnSale && discountPercentage && (
              <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-br-md shadow-md">
                -{discountPercentage}%
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <WishlistButton product={product} size="sm" overlay />

          {/* Quick View Button - Show on Hover (Desktop Only) */}
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

        {/* Product Info */}
        <div className="flex flex-col gap-2 flex-1 px-1">
          {/* Title - 固定2行高度 */}
          <LocalizedClientLink href={`/products/${product.handle}`}>
            <Text 
              className="text-sm font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors duration-200 h-10"
              data-testid="product-title"
            >
              {product.title}
            </Text>
          </LocalizedClientLink>

          {/* Subtitle - 始终显示，保持布局一致 */}
          <Text 
            className="text-xs text-muted-foreground line-clamp-1 h-4"
            data-testid="product-subtitle"
          >
            {product.subtitle || "\u00A0"}
          </Text>

          {/* Product Rating */}
          <ProductRating productId={product.id} size="sm" showCount={true} />

          {/* Price */}
          <div className="flex items-center gap-x-2">
            {displayPrice && (
              <PreviewPriceClient 
                price={displayPrice} 
                selectedVariant={selectedVariant}
              />
            )}
          </div>

          {/* Variant Selector - Compact Version */}
          {product.variants && product.variants.length > 1 && product.options && product.options.length > 0 && (
            <div className="mt-1">
              <VariantSelector
                product={product}
                options={options}
                onOptionChange={handleOptionChange}
                compact={true}
              />
            </div>
          )}

          {/* Quick Add Button */}
          <div className="mt-2">
            <QuickAddButton
              product={product}
              selectedVariant={selectedVariant || undefined}
              options={options}
              onOpenQuickView={() => setIsQuickViewOpen(true)}
              compact={true}
              customer={customer}
              loyaltyAccount={loyaltyAccount}
              membershipProductIds={membershipProductIds}
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

export default ProductPreview
