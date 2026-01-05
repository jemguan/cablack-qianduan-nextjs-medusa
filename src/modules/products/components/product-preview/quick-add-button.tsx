"use client"

import { addToCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button, clx } from "@medusajs/ui"
import ShoppingBag from "@modules/common/icons/shopping-bag"
import Check from "@modules/common/icons/check"
import { useParams } from "next/navigation"
import { useState, useMemo } from "react"
import { isEqual } from "lodash"

type QuickAddButtonProps = {
  product: HttpTypes.StoreProduct
  selectedVariant: HttpTypes.StoreProductVariant | null | undefined
  options: Record<string, string | undefined>
  onOpenQuickView?: () => void
  compact?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

const QuickAddButton: React.FC<QuickAddButtonProps> = ({
  product,
  selectedVariant,
  options,
  onOpenQuickView,
  compact = false,
}) => {
  const [isAdding, setIsAdding] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const params = useParams()
  const countryCode = params?.countryCode as string

  // Check if all options are selected
  const allOptionsSelected = useMemo(() => {
    if (!product.options || product.options.length === 0) return true
    return product.options.every(option => options[option.id])
  }, [product.options, options])

  // Check if variant is valid
  const isValidVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return false
    return product.variants.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // Check if variant is in stock
  // According to Medusa docs: variant is in stock if manage_inventory === false OR inventory_quantity > 0
  const inStock = useMemo(() => {
    if (!selectedVariant) {
      // If no variant selected, check if any variant is in stock
      return product.variants?.some((v) => {
        if (v.manage_inventory === false) return true
        if (v.allow_backorder === true) return true
        // Check inventory quantity (if null/undefined, consider out of stock per Medusa docs)
        return (v.inventory_quantity || 0) > 0
      }) ?? false
    }
    
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

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id || !inStock || !isValidVariant) {
      if (onOpenQuickView && product.variants && product.variants.length > 1) {
        onOpenQuickView()
      }
      return
    }

    setIsAdding(true)
    setIsSuccess(false)

    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
      })

      setIsSuccess(true)
      // addToCart 内部已调用 revalidateTag，无需 router.refresh()

      // Reset success state after 2 seconds
      setTimeout(() => {
        setIsSuccess(false)
      }, 2000)
    } catch (error) {
      console.error("Failed to add to cart:", error)
    } finally {
      setIsAdding(false)
    }
  }

  // If product has multiple variants and options are not all selected
  if (product.variants && product.variants.length > 1 && !allOptionsSelected) {
    return (
      <Button
        onClick={onOpenQuickView}
        variant="secondary"
        className={clx(
          "w-full transition-all duration-200",
          compact ? "h-8 text-xs" : "h-10"
        )}
        disabled={isAdding}
      >
        Select Options
      </Button>
    )
  }

  // If variant is not valid or not in stock
  if (!isValidVariant || !inStock) {
    return (
      <Button
        onClick={onOpenQuickView}
        variant="secondary"
        className={clx(
          "w-full transition-all duration-200",
          compact ? "h-8 text-xs" : "h-10"
        )}
        disabled={isAdding}
      >
        {!inStock ? "Out of Stock" : "Select Options"}
      </Button>
    )
  }

  return (
    <Button
      onClick={handleAddToCart}
      variant="primary"
      className={clx(
        "w-full transition-all duration-200 hover:scale-105 active:scale-95",
        compact ? "h-8 text-xs" : "h-10",
        isSuccess 
          ? "bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white border-none !border-2 !border-green-600 hover:!border-green-700 dark:!border-green-600 dark:hover:!border-green-700 disabled:!border-ui-border-base !shadow-none"
          : "bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white border-none !border-2 !border-orange-600 hover:!border-orange-700 dark:!border-orange-600 dark:hover:!border-orange-700 disabled:!border-ui-border-base !shadow-none"
      )}
      style={{ borderColor: isSuccess ? 'rgb(22 163 74)' : 'rgb(234 88 12)', borderWidth: '2px', borderStyle: 'solid' }}
      disabled={isAdding || !selectedVariant}
      isLoading={isAdding}
    >
      {isSuccess ? (
        <span className="flex items-center gap-2">
          <Check size="16" />
          Added
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <ShoppingBag size="16" />
          Add to Cart
        </span>
      )}
    </Button>
  )
}

export default QuickAddButton

