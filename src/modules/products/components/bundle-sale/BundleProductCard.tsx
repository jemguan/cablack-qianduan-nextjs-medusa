"use client"

import { Text, clx } from "@medusajs/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PreviewPriceClient from "../product-preview/preview-price-client"
import { useState, useMemo, useEffect } from "react"
import { isEqual } from "lodash"
import Image from "next/image"
import { getImageUrl } from "@lib/util/image"
import { ChevronDownMini } from "@medusajs/icons"
import ProductRating from "../reviews/ProductRating"

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

type BundleProductCardProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  /** 是否是主产品 */
  isMainProduct?: boolean
  /** 产品数量（用于显示数量标签） */
  quantity?: number
  /** 选中的变体 ID */
  selectedVariantId?: string
  /** 变体变更回调 */
  onVariantChange?: (productId: string, variantId: string) => void
}

/**
 * Bundle 专用产品卡片组件
 * 特点：
 * - 无 Add to Cart 按钮
 * - 下拉式变体选择器
 * - 可选显示主产品/数量标签
 */
const BundleProductCard = ({
  product,
  region,
  isMainProduct = false,
  quantity = 1,
  selectedVariantId,
  onVariantChange,
}: BundleProductCardProps) => {
  const [options, setOptions] = useState<Record<string, string | undefined>>({})

  // Initialize options from selectedVariantId or first variant
  useEffect(() => {
    if (selectedVariantId && product.variants) {
      const variant = product.variants.find((v) => v.id === selectedVariantId)
      if (variant) {
        const variantOptions = optionsAsKeymap(variant.options)
        setOptions(variantOptions ?? {})
        return
      }
    }
    // Default: select first variant
    if (product.variants?.length) {
      const firstVariant = product.variants[0]
      const variantOptions = optionsAsKeymap(firstVariant.options)
      setOptions(variantOptions ?? {})
      // Notify parent
      if (onVariantChange && firstVariant.id) {
        onVariantChange(product.id, firstVariant.id)
      }
    }
  }, [product.variants, selectedVariantId])

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

  const handleOptionChange = (optionId: string, value: string) => {
    const newOptions = {
      ...options,
      [optionId]: value,
    }
    setOptions(newOptions)

    // Find the matching variant and notify parent
    const matchingVariant = product.variants?.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, newOptions)
    })

    if (matchingVariant && onVariantChange) {
      onVariantChange(product.id, matchingVariant.id)
    }
  }

  // Get images for selected variant
  const displayImages = useMemo(() => {
    const allImages = product.images || []

    if (!selectedVariant || !product.variants) {
      return allImages.length > 0
        ? allImages
        : product.thumbnail
          ? [{ url: product.thumbnail }]
          : []
    }

    if (!selectedVariant.images || selectedVariant.images.length === 0) {
      return allImages.length > 0
        ? [allImages[0]]
        : product.thumbnail
          ? [{ url: product.thumbnail }]
          : []
    }

    const imageMap = new Map(allImages.map((img) => [img.id, img]))
    const variantImages = selectedVariant.images
      .map((variantImg: any) => imageMap.get(variantImg.id))
      .filter((img: any) => img !== undefined)

    if (variantImages.length > 0) {
      return variantImages
    }

    return allImages.length > 0
      ? [allImages[0]]
      : product.thumbnail
        ? [{ url: product.thumbnail }]
        : []
  }, [product.images, product.thumbnail, product.variants, selectedVariant])

  // Check if product is on sale
  const isOnSale = displayPrice?.price_type === "sale"
  const discountPercentage = displayPrice?.percentage_diff

  // Check stock status
  const inStock = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return true
    }

    if (!selectedVariant) {
      return product.variants.some((v) => {
        if (v.manage_inventory === false) return true
        if (v.allow_backorder === true) return true
        return (v.inventory_quantity || 0) > 0
      })
    }

    if (selectedVariant.manage_inventory === false) return true
    if (selectedVariant.allow_backorder === true) return true
    return (selectedVariant.inventory_quantity || 0) > 0
  }, [selectedVariant, product.variants])

  // Check if variant is in stock
  const isVariantInStock = (
    variant: HttpTypes.StoreProductVariant
  ): boolean => {
    if (variant.manage_inventory === false) return true
    if (variant.allow_backorder === true) return true
    return (variant.inventory_quantity || 0) > 0
  }

  // Check if an option value is available
  const isOptionValueAvailable = (optionId: string, value: string): boolean => {
    const availableVariants =
      product.variants?.filter((v) => {
        const variantOptions = optionsAsKeymap(v.options)
        return variantOptions?.[optionId] === value
      }) || []
    return availableVariants.some((v) => isVariantInStock(v))
  }

  return (
    <div className="group relative flex flex-col h-full transition-all duration-300 hover:shadow-md rounded-lg p-1.5">
      {/* 标签：数量 */}
      {!isMainProduct && quantity > 1 && (
        <div className="absolute -top-2 -left-2 z-10 bg-ui-fg-subtle text-white text-xs px-2 py-0.5 rounded-md font-medium shadow-md">
          ×{quantity}
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-ui-bg-subtle mb-2 shadow-sm group-hover:shadow-md transition-shadow duration-300">
        <LocalizedClientLink
          href={`/products/${product.handle}`}
          className="absolute inset-0 z-10"
          aria-label={`View ${product.title}`}
        />

        {/* Product Image */}
        {displayImages.length > 0 &&
          displayImages[0]?.url &&
          (() => {
            const firstImageUrl = getImageUrl(displayImages[0].url || "")
            if (!firstImageUrl) return null
            return (
              <div className="relative w-full h-full">
                <Image
                  src={firstImageUrl}
                  alt={product.title || "Product"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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

        {/* Out of Stock Overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <span className="text-white text-sm font-medium">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col gap-1.5 flex-1 px-1">
        {/* Title */}
        <LocalizedClientLink href={`/products/${product.handle}`}>
          <Text
            className="text-sm font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors duration-200"
            data-testid="product-title"
          >
            {product.title}
          </Text>
        </LocalizedClientLink>

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

        {/* Dropdown Variant Selector */}
        {product.variants &&
          product.variants.length > 1 &&
          product.options &&
          product.options.length > 0 && (
            <div className="mt-1 flex flex-col gap-2">
              {product.options.map((option) => {
                const currentValue = options[option.id]
                const values = option.values || []

                return (
                  <div key={option.id} className="relative">
                    <select
                      value={currentValue || ""}
                      onChange={(e) =>
                        handleOptionChange(option.id, e.target.value)
                      }
                      className={clx(
                        "w-full appearance-none bg-ui-bg-field border border-ui-border-base rounded-md",
                        "px-3 py-2 pr-8 text-xs text-ui-fg-base",
                        "focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive focus:border-transparent",
                        "cursor-pointer hover:border-ui-border-hover transition-colors"
                      )}
                    >
                      {values.map((valueObj) => {
                        const value = valueObj.value || ""
                        const isAvailable = isOptionValueAvailable(
                          option.id,
                          value
                        )

                        return (
                          <option
                            key={value}
                            value={value}
                            disabled={!isAvailable}
                            className={clx(!isAvailable && "text-ui-fg-muted")}
                          >
                            {value}
                            {!isAvailable ? " (Out of Stock)" : ""}
                          </option>
                        )
                      })}
                    </select>
                    {/* Dropdown Arrow */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-ui-fg-muted">
                      <ChevronDownMini />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
      </div>
    </div>
  )
}

export default BundleProductCard

