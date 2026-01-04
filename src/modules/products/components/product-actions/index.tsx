"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { isEqual } from "lodash"
import ProductPrice from "../product-price"
// import MobileActions from "./mobile-actions" // 已禁用，使用 StickyAddToCart 替代
import { useVariantSelection } from "@modules/products/contexts/variant-selection-context"
import { ProductQuantitySelector } from "../quantity-selector"
import WishlistButton from "@modules/wishlist/components/wishlist-button"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
  /** 移动端布局模式：隐藏价格，只显示变体选择、数量选择和按钮 */
  mobileLayout?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
  mobileLayout = false,
}: ProductActionsProps) {
  const { options, selectedVariant, setOptionValue, setOptions } = useVariantSelection()
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const countryCode = useParams().countryCode as string

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // 不再更新 URL 中的 v_id 参数，保持 URL 简洁

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // 计算最大可选数量（基于库存）
  const maxQuantity = useMemo(() => {
    if (!selectedVariant) return 99
    if (!selectedVariant.manage_inventory) return 99
    if (selectedVariant.allow_backorder) return 99
    return Math.min(selectedVariant.inventory_quantity || 99, 99)
  }, [selectedVariant])

  // 当变体变化时，重置数量为1
  useEffect(() => {
    setQuantity(1)
  }, [selectedVariant?.id])

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) {
      return null
    }

    setIsAdding(true)

    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity,
        countryCode,
      })
    } catch (error) {
      console.error("Failed to add to cart:", error)
      throw error
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={mobileLayout ? undefined : actionsRef}>
        {/* 变体选择器 */}
        {(product.variants?.length ?? 0) > 1 && (
          <div className="flex flex-col gap-y-4">
            {(product.options || []).map((option) => {
              return (
                <div key={option.id}>
                  <OptionSelect
                    option={option}
                    current={options[option.id]}
                    updateOption={setOptionValue}
                    title={option.title ?? ""}
                    data-testid="product-options"
                    disabled={!!disabled || isAdding}
                    product={product}
                    options={options}
                  />
                </div>
              )
            })}
            {!mobileLayout && <Divider />}
          </div>
        )}

        {/* 价格 - 移动端布局时隐藏 */}
        {!mobileLayout && (
          <ProductPrice product={product} variant={selectedVariant || undefined} />
        )}

        {/* 数量选择器 */}
        <ProductQuantitySelector
          quantity={quantity}
          onQuantityChange={setQuantity}
          minQuantity={1}
          maxQuantity={maxQuantity}
          showLabel={true}
          size="md"
          disabled={!!disabled || isAdding || !selectedVariant || !isValidVariant}
        />

        {/* 加入购物车和心愿单按钮 */}
        <div className="flex gap-2">
          <Button
            onClick={handleAddToCart}
            disabled={
              !inStock ||
              !selectedVariant ||
              !!disabled ||
              isAdding ||
              !isValidVariant
            }
            variant="primary"
            className="flex-1 h-10"
            isLoading={isAdding}
            data-testid="add-product-button"
          >
            {!selectedVariant && !options
              ? "Select variant"
              : !inStock || !isValidVariant
              ? "Out of stock"
              : "Add to cart"}
          </Button>
          <WishlistButton product={product} size="md" iconOnly />
        </div>
        {/* MobileActions 已禁用，因为 StickyAddToCart 提供了更好的移动端体验 */}
        {/* <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        /> */}
      </div>
    </>
  )
}
