"use client"

import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import React, { useMemo, useState, useRef, useEffect } from "react"
import { isEqual } from "lodash"

type VariantSelectorProps = {
  product: HttpTypes.StoreProduct
  options: Record<string, string | undefined>
  onOptionChange: (optionId: string, value: string) => void
  disabled?: boolean
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

// Check if a color value (for color detection)
const isColorValue = (value: string): boolean => {
  const colorKeywords = [
    'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray', 'grey',
    'brown', 'beige', 'navy', 'teal', 'cyan', 'magenta', 'lime', 'olive', 'maroon', 'silver', 'gold'
  ]
  const lowerValue = value.toLowerCase()
  return colorKeywords.some(keyword => lowerValue.includes(keyword)) || 
         /^#[0-9A-Fa-f]{6}$/.test(value) || 
         /^rgb\(|^rgba\(/i.test(value)
}

// Get color from value (try to extract hex or use CSS color name)
const getColorValue = (value: string): string => {
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
    return value
  }
  // Try to map common color names to hex
  const colorMap: Record<string, string> = {
    'red': '#EF4444',
    'blue': '#3B82F6',
    'green': '#10B981',
    'yellow': '#F59E0B',
    'orange': '#F97316',
    'purple': '#A855F7',
    'pink': '#EC4899',
    'black': '#000000',
    'white': '#FFFFFF',
    'gray': '#6B7280',
    'grey': '#6B7280',
    'brown': '#92400E',
    'beige': '#F5F5DC',
    'navy': '#1E3A8A',
    'teal': '#14B8A6',
  }
  const lowerValue = value.toLowerCase()
  for (const [key, hex] of Object.entries(colorMap)) {
    if (lowerValue.includes(key)) {
      return hex
    }
  }
  return '#6B7280' // Default gray
}

const VariantSelector: React.FC<VariantSelectorProps> = ({
  product,
  options,
  onOptionChange,
  disabled = false,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showExpandButton, setShowExpandButton] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<HTMLDivElement>(null)

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return null
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // Check if we need to show expand button (only in compact mode)
  useEffect(() => {
    if (!compact || !containerRef.current || !itemsRef.current) {
      return
    }

    const checkOverflow = () => {
      if (itemsRef.current) {
        const containerWidth = containerRef.current?.clientWidth || 0
        const itemsWidth = itemsRef.current.scrollWidth
        setShowExpandButton(itemsWidth > containerWidth)
      }
    }

    checkOverflow()
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [compact, product.options])

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

  // Check if an option value is available
  const isOptionValueAvailable = (optionId: string, value: string): boolean => {
    const availableVariants = getAvailableVariants(optionId, value)
    return availableVariants.some(v => isVariantInStock(v))
  }

  if (!product.options || product.options.length === 0) {
    return null
  }

  return (
    <div className={clx("flex flex-col gap-y-2", compact && "gap-y-1.5")}>
      {product.options.map((option) => {
        const currentValue = options[option.id]
        const isColorOption = option.title?.toLowerCase().includes('color') || 
                             option.title?.toLowerCase().includes('colour') ||
                             (option.values || []).some(v => isColorValue(v.value || ''))

        const values = option.values || []
        // In compact mode on mobile, always show all items (no expand button)
        // On desktop compact mode, show max 5 items initially
        const maxVisible = compact && !isMobile ? 5 : values.length
        const shouldShowExpand = compact && !isMobile && values.length > maxVisible
        const visibleCount = shouldShowExpand && !isExpanded ? maxVisible : values.length
        const visibleValues = values.slice(0, visibleCount)
        const hiddenValues = values.slice(visibleCount)

        return (
          <div key={option.id} className="flex flex-col gap-y-1.5" ref={option.id === product.options?.[0]?.id ? containerRef : undefined}>
            {!compact && (
              <span className="text-xs font-medium text-muted-foreground">
                {option.title}
              </span>
            )}
            <div className="relative">
              <div 
                className={clx(
                  "flex gap-2",
                  compact && !isExpanded && !isMobile ? "flex-nowrap overflow-x-auto no-scrollbar" : "flex-wrap",
                  compact && isMobile && "flex-nowrap overflow-x-auto no-scrollbar"
                )}
                ref={option.id === product.options?.[0]?.id ? itemsRef : undefined}
                style={compact && !isExpanded && !isMobile ? { 
                  paddingRight: shouldShowExpand ? '60px' : '0'
                } : {}}
              >
              {visibleValues.map((valueObj) => {
                const value = valueObj.value || ''
                const isSelected = currentValue === value
                const isAvailable = isOptionValueAvailable(option.id, value)
                const colorValue = isColorOption ? getColorValue(value) : null

                return (
                  <button
                    key={value}
                    onClick={() => onOptionChange(option.id, value)}
                    disabled={disabled || !isAvailable}
                    className={clx(
                      "relative transition-all duration-200 flex-shrink-0",
                      isColorOption
                        ? "w-8 h-8 rounded-full border-2 flex items-center justify-center hover:scale-110"
                        : "px-3 py-1.5 text-xs rounded-md border hover:scale-105",
                      {
                        "border-primary ring-2 ring-primary ring-offset-2 shadow-md": isSelected,
                        "border-border hover:border-primary/50 hover:shadow-sm": !isSelected && isAvailable,
                        "opacity-50 cursor-not-allowed": !isAvailable,
                        "border-muted": !isSelected && isAvailable,
                      }
                    )}
                    style={isColorOption && colorValue ? { backgroundColor: colorValue } : undefined}
                    title={value}
                    aria-label={`Select ${option.title}: ${value}`}
                  >
                    {isColorOption ? (
                      <>
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white drop-shadow-md"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </>
                    ) : (
                      <span className={clx(
                        "font-medium",
                        isSelected ? "text-primary" : "text-foreground"
                      )}>
                        {value}
                      </span>
                    )}
                  </button>
                )
              })}
              </div>
              {/* Only show expand button on desktop, not on mobile */}
              {shouldShowExpand && !isMobile && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsExpanded(!isExpanded)
                  }}
                  className={clx(
                    "px-3 py-1.5 text-xs rounded-md border border-border hover:border-primary/50 hover:shadow-sm text-muted-foreground hover:text-foreground transition-all duration-200 flex-shrink-0",
                    compact && !isExpanded ? "absolute right-0 top-0 bg-background/95 backdrop-blur-sm z-10" : ""
                  )}
                  aria-label={isExpanded ? "Show less" : `Show ${hiddenValues.length} more`}
                >
                  {isExpanded ? "Less" : `+${hiddenValues.length}`}
                </button>
              )}
              {isExpanded && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {hiddenValues.map((valueObj) => {
                const value = valueObj.value || ''
                const isSelected = currentValue === value
                const isAvailable = isOptionValueAvailable(option.id, value)
                const colorValue = isColorOption ? getColorValue(value) : null

                return (
                  <button
                    key={value}
                    onClick={() => onOptionChange(option.id, value)}
                    disabled={disabled || !isAvailable}
                    className={clx(
                      "relative transition-all duration-200 flex-shrink-0",
                      isColorOption
                        ? "w-8 h-8 rounded-full border-2 flex items-center justify-center hover:scale-110"
                        : "px-3 py-1.5 text-xs rounded-md border hover:scale-105",
                      {
                        "border-primary ring-2 ring-primary ring-offset-2 shadow-md": isSelected,
                        "border-border hover:border-primary/50 hover:shadow-sm": !isSelected && isAvailable,
                        "opacity-50 cursor-not-allowed": !isAvailable,
                        "border-muted": !isSelected && isAvailable,
                      }
                    )}
                    style={isColorOption && colorValue ? { backgroundColor: colorValue } : undefined}
                    title={value}
                    aria-label={`Select ${option.title}: ${value}`}
                  >
                    {isColorOption ? (
                      <>
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white drop-shadow-md"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </>
                    ) : (
                      <span className={clx(
                        "font-medium",
                        isSelected ? "text-primary" : "text-foreground"
                      )}>
                        {value}
                      </span>
                    )}
                  </button>
                )
              })}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default VariantSelector

