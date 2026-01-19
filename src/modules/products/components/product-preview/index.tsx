"use client"

import { Text, clx } from "@medusajs/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PreviewPriceClient from "./preview-price-client"
import VariantSelector from "./variant-selector"
import QuickAddButton from "./quick-add-button"
import { memo, useState, useMemo, useEffect, useCallback } from "react"
import { isEqual } from "lodash"
import Eye from "@modules/common/icons/eye"
import Image from "next/image"
import dynamic from "next/dynamic"
import { getImageUrl } from "@lib/util/image"
import ProductRating from "../reviews/ProductRating"
import WishlistButton from "@modules/wishlist/components/wishlist-button"
import type { LoyaltyAccount } from "@/types/loyalty"

// 动态导入 QuickViewModal，仅在需要时加载（减少初始 JS 包大小）
const QuickViewModal = dynamic(() => import("./quick-view-modal"), {
  ssr: false,
})

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

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

const ProductPreview = memo(function ProductPreview({
  product,
  isFeatured,
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
    if (!product.variants || product.variants.length === 0) {
      return null
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
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

  // Get images for selected variant (same logic as product detail page)
  const displayImages = useMemo(() => {
    const allImages = product.images || []
    
    // If no variant selected, return all product images
    if (!selectedVariant || !product.variants) {
      return allImages.length > 0 ? allImages : (product.thumbnail ? [{ url: product.thumbnail }] : [])
    }

    // Check if variant has images
    if (!selectedVariant.images || selectedVariant.images.length === 0) {
      // No variant images, return first product image
      return allImages.length > 0 ? [allImages[0]] : (product.thumbnail ? [{ url: product.thumbnail }] : [])
    }

    // If variant has images, filter product images by variant image IDs
    // Create a map of image ID to image object for quick lookup
    const imageMap = new Map(allImages.map((img) => [img.id, img]))
    
    // Build variant images array in the order specified by variant.images
    let variantImages = selectedVariant.images
      .map((variantImg: any) => imageMap.get(variantImg.id))
      .filter((img: any) => img !== undefined) // Remove any images not found in product.images
    
    // Find variant-specific images (images that appear in fewer variants)
    // Collect all variant image IDs to find unique ones
    const allVariantImageIds = new Set<string>()
    product.variants?.forEach((v) => {
      v.images?.forEach((img: any) => {
        allVariantImageIds.add(img.id)
      })
    })
    
    // Count how many variants each image appears in
    const imageVariantCount = new Map<string, number>()
    product.variants?.forEach((v) => {
      v.images?.forEach((img: any) => {
        const count = imageVariantCount.get(img.id) || 0
        imageVariantCount.set(img.id, count + 1)
      })
    })
    
    // Find variant-specific images (appear in only 1 variant) and common images (appear in all variants)
    const variantSpecificImages: typeof variantImages = []
    const commonImages: typeof variantImages = []
    const otherImages: typeof variantImages = []
    
    variantImages.forEach((img) => {
      if (!img?.id) return
      const count = imageVariantCount.get(img.id) || 0
      const totalVariants = product.variants?.length || 1
      
      if (count === 1) {
        // Variant-specific (only appears in this variant)
        variantSpecificImages.push(img)
      } else if (count === totalVariants) {
        // Common to all variants
        commonImages.push(img)
      } else {
        // Appears in some but not all variants
        otherImages.push(img)
      }
    })
    
    // Reorder: variant-specific first, then others maintaining original order
    variantImages = [...variantSpecificImages, ...otherImages, ...commonImages]
    
    // If variant has matching images, return them; otherwise return first product image
    if (variantImages.length > 0) {
      return variantImages
    }
    
    // Fallback to first product image if variant has no matching images
    return allImages.length > 0 ? [allImages[0]] : (product.thumbnail ? [{ url: product.thumbnail }] : [])
  }, [product.images, product.thumbnail, product.variants, selectedVariant])

  // Check if product is on sale (use selected variant price if available, otherwise cheapest)
  const isOnSale = displayPrice?.price_type === "sale"
  const discountPercentage = displayPrice?.percentage_diff

  // Check stock status
  const inStock = useMemo(() => {
    // If no variants, assume in stock
    if (!product.variants || product.variants.length === 0) {
      return true
    }

    // If no variant selected, check if any variant is in stock
    // According to Medusa docs: variant is in stock if manage_inventory === false OR inventory_quantity > 0
    if (!selectedVariant) {
      const hasStock = product.variants.some((v) => {
        // If inventory is not managed, always in stock
        if (v.manage_inventory === false) {
          return true
        }
        // If backorder is allowed, always in stock
        if (v.allow_backorder === true) {
          return true
        }
        // Check inventory quantity (if null/undefined, consider out of stock per Medusa docs)
        return (v.inventory_quantity || 0) > 0
      })
      return hasStock
    }

    // Check selected variant
    // According to Medusa docs: variant is in stock if manage_inventory === false OR inventory_quantity > 0
    // If inventory is not managed, always in stock
    if (selectedVariant.manage_inventory === false) {
      return true
    }
    // If backorder is allowed, always in stock
    if (selectedVariant.allow_backorder === true) {
      return true
    }
    // Check inventory quantity (if null/undefined, consider out of stock per Medusa docs)
    return (selectedVariant.inventory_quantity || 0) > 0
  }, [selectedVariant, product.variants])

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
})

export default ProductPreview
