import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  product: HttpTypes.StoreProduct
  options: Record<string, string | undefined>
  "data-testid"?: string
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
  product,
}) => {
  const filteredOptions = (option.values ?? []).map((v) => v.value)

  // Check if variant is in stock
  const isVariantInStock = (variant: HttpTypes.StoreProductVariant): boolean => {
    // According to Medusa docs: variant is in stock if manage_inventory === false OR inventory_quantity > 0
    // If inventory is not managed, always in stock
    if (variant.manage_inventory === false) {
      return true
    }
    // If backorder is allowed, always in stock
    if (variant.allow_backorder === true) {
      return true
    }
    // Check inventory quantity (if null/undefined, consider out of stock per Medusa docs)
    return (variant.inventory_quantity || 0) > 0
  }

  // Get available variants for an option value
  const getAvailableVariants = (optionId: string, value: string): HttpTypes.StoreProductVariant[] => {
    return product.variants?.filter((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return variantOptions?.[optionId] === value
    }) || []
  }

  // Check if an option value is available (has at least one variant in stock)
  const isOptionValueAvailable = (optionId: string, value: string): boolean => {
    const availableVariants = getAvailableVariants(optionId, value)
    return availableVariants.some(v => isVariantInStock(v))
  }

  return (
    <div className="flex flex-col gap-y-3">
      <span className="text-sm">Select {title}</span>
      <div
        className="flex flex-wrap gap-2"
        data-testid={dataTestId}
        suppressHydrationWarning
      >
        {filteredOptions.map((v) => {
          const isAvailable = isOptionValueAvailable(option.id, v)
          const isSelected = v === current
          
          return (
            <button
              onClick={() => updateOption(option.id, v)}
              key={v}
              className={clx(
                "border-ui-border-base bg-ui-bg-subtle border text-small-regular h-10 rounded-rounded px-3 py-2 whitespace-nowrap flex-shrink-0 transition-all duration-150",
                {
                  "border-ui-border-interactive": isSelected,
                  "hover:shadow-elevation-card-rest": v !== current && isAvailable,
                  "opacity-50 cursor-not-allowed": !isAvailable,
                  "hover:border-ui-border-interactive/50": v !== current && isAvailable,
                }
              )}
              disabled={disabled || !isAvailable}
              data-testid="option-button"
              title={!isAvailable ? "Out of stock" : undefined}
            >
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
