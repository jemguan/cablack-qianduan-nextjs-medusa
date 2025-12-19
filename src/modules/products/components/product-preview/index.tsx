"use client"

import { Text, clx } from "@medusajs/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PreviewPriceClient from "./preview-price-client"
import QuickViewModal from "./quick-view-modal"
import VariantSelector from "./variant-selector"
import QuickAddButton from "./quick-add-button"
import { useState, useMemo, useEffect } from "react"
import { isEqual } from "lodash"
import Eye from "@modules/common/icons/eye"
import Image from "next/image"
import { getImageUrl } from "@lib/util/image"

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
}

const ProductPreview = ({
  product,
  isFeatured,
  region,
}: ProductPreviewProps) => {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [hoveredImageIndex, setHoveredImageIndex] = useState(0)

  const { cheapestPrice } = getProductPrice({ product })

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

  const handleOptionChange = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  const images = product.images || []
  const displayImages = images.length > 0 ? images : (product.thumbnail ? [{ url: product.thumbnail }] : [])
  const hasMultipleImages = displayImages.length > 1

  // Check if product is on sale
  const isOnSale = cheapestPrice?.price_type === "sale"
  const discountPercentage = cheapestPrice?.percentage_diff

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
          {displayImages.length > 0 && (
            <div className="relative w-full h-full">
              <Image
                src={getImageUrl(displayImages[hoveredImageIndex]?.url || displayImages[0].url)}
                alt={product.title || "Product"}
                fill
                className={clx(
                  "object-cover transition-opacity duration-300",
                  hasMultipleImages && "group-hover:opacity-0"
                )}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              {hasMultipleImages && displayImages[1] && (
                <Image
                  src={getImageUrl(displayImages[1].url)}
                  alt={product.title || "Product"}
                  fill
                  className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              )}
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
            {isOnSale && discountPercentage && (
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-md shadow-md animate-pulse">
                -{discountPercentage}%
              </span>
            )}
          </div>

          {/* Quick View Button - Show on Hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none">
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
          {/* Title */}
          <LocalizedClientLink href={`/products/${product.handle}`}>
            <Text 
              className="text-sm font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors duration-200"
              data-testid="product-title"
            >
              {product.title}
            </Text>
          </LocalizedClientLink>

          {/* Subtitle */}
          {product.subtitle && (
            <Text 
              className="text-xs text-muted-foreground line-clamp-1"
              data-testid="product-subtitle"
            >
              {product.subtitle}
            </Text>
          )}

          {/* Price */}
          <div className="flex items-center gap-x-2">
            {cheapestPrice && <PreviewPriceClient price={cheapestPrice} />}
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
      />
    </>
  )
}

export default ProductPreview
