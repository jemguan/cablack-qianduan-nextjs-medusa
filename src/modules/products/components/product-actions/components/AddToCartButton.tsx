"use client"

import { Button } from "@medusajs/ui"

type AddToCartButtonProps = {
  onClick: () => void
  isLoading: boolean
  disabled: boolean
  isValidVariant: boolean
  hasSelectedVariant: boolean
  isValidOptionSelections: boolean
  hasOptions: boolean
}

/**
 * 统一的添加购物车按钮组件
 */
export function AddToCartButton({
  onClick,
  isLoading,
  disabled,
  isValidVariant,
  hasSelectedVariant,
  isValidOptionSelections,
  hasOptions,
}: AddToCartButtonProps) {
  const isDisabled = disabled || !isValidVariant || !hasSelectedVariant || !isValidOptionSelections

  const getButtonText = () => {
    if (!hasSelectedVariant && !hasOptions) {
      return "Select variant"
    }
    if (!isValidOptionSelections) {
      return "Select Options"
    }
    return "Add to Cart"
  }

  return (
    <Button
      onClick={onClick}
      disabled={isDisabled}
      variant="primary"
      className={`flex-1 h-10 text-white border-none !border-2 !shadow-none ${
        isDisabled
          ? "bg-ui-bg-disabled hover:bg-ui-bg-disabled dark:bg-ui-bg-disabled dark:hover:bg-ui-bg-disabled !border-ui-border-base cursor-not-allowed"
          : "bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 !border-orange-600 hover:!border-orange-700 dark:!border-orange-600 dark:hover:!border-orange-700"
      }`}
      style={
        isDisabled
          ? { borderColor: 'rgb(229 231 235)', borderWidth: '2px', borderStyle: 'solid' }
          : { borderColor: 'rgb(234 88 12)', borderWidth: '2px', borderStyle: 'solid' }
      }
      isLoading={isLoading}
      data-testid="add-product-button"
    >
      {getButtonText()}
    </Button>
  )
}
