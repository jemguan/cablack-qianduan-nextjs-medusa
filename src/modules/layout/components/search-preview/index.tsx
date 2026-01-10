"use client"

import React from "react"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getProductPrice } from "@lib/util/get-product-price"
import SearchPreviewPrice from "./price"
import { Text } from "@medusajs/ui"

interface SearchPreviewProps {
  products: HttpTypes.StoreProduct[]
  searchTerm: string
  count: number
  isLoading: boolean
  onClose: () => void
  onProductClick: (searchTerm: string) => void
  variant?: "desktop" | "mobile"
}

const SearchPreview = ({
  products,
  searchTerm,
  count,
  isLoading,
  onClose,
  onProductClick,
  variant = "desktop",
}: SearchPreviewProps) => {
  const isMobile = variant === "mobile"
  const maxHeight = isMobile ? "max-h-[60vh]" : "max-h-96"
  
  if (isLoading) {
    return (
      <div className={`${isMobile ? "relative" : "absolute top-full left-0 right-0"} mt-2 bg-background ${isMobile ? "" : "border border-border rounded-lg shadow-lg"} z-[9999] ${maxHeight} overflow-y-auto`}>
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
            <span className="text-sm text-muted-foreground">Searching...</span>
          </div>
        </div>
      </div>
    )
  }

  if (products.length === 0 && searchTerm.trim()) {
    return (
      <div className={`${isMobile ? "relative" : "absolute top-full left-0 right-0"} mt-2 bg-background ${isMobile ? "" : "border border-border rounded-lg shadow-lg"} z-[9999]`}>
        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-2 text-center">No products found</p>
          <p className="text-xs text-muted-foreground mb-3 text-center">Try:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Check spelling</li>
            <li>• Use more general keywords</li>
            <li>• Reduce the number of search terms</li>
          </ul>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  const handleProductClick = () => {
    onProductClick(searchTerm)
    onClose()
  }

  const handleViewAllClick = () => {
    onProductClick(searchTerm)
    onClose()
  }

  return (
    <div className={`${isMobile ? "relative" : "absolute top-full left-0 right-0"} mt-2 bg-background ${isMobile ? "" : "border border-border rounded-lg shadow-lg"} z-[9999] ${maxHeight} overflow-y-auto`}>
      <div className="p-2">
        {products.map((product) => {
          const { cheapestPrice } = getProductPrice({ product })

          return (
            <button
              key={product.id}
              onClick={handleProductClick}
              className={`w-full flex items-center gap-3 ${isMobile ? "p-3" : "p-2"} hover:bg-muted active:bg-muted/80 rounded-md transition-colors group text-left touch-manipulation`}
            >
              <div className={`flex-shrink-0 ${isMobile ? "w-20 h-20" : "w-16 h-16"} relative overflow-hidden rounded-md bg-ui-bg-subtle`}>
                {product.thumbnail ? (
                  <img
                    src={product.thumbnail}
                    alt={product.title || "Product"}
                    className="w-full h-full object-cover"
                  />
                ) : product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0].url}
                    alt={product.title || "Product"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-ui-bg-subtle">
                    <span className="text-xs text-muted-foreground">No image</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Text className={`${isMobile ? "text-base" : "text-sm"} font-medium text-foreground group-hover:text-primary line-clamp-1`}>
                  {product.title}
                </Text>
                {cheapestPrice && (
                  <div className="mt-1 flex items-center gap-1">
                    <SearchPreviewPrice price={cheapestPrice} />
                  </div>
                )}
              </div>
            </button>
          )
        })}
        {count > products.length && (
          <button
            onClick={handleViewAllClick}
            className={`w-full ${isMobile ? "p-4" : "p-3"} text-center ${isMobile ? "text-base" : "text-sm"} font-medium text-primary hover:bg-muted active:bg-muted/80 border-t border-border transition-colors touch-manipulation`}
          >
            View all results ({count} {count === 1 ? 'product' : 'products'})
          </button>
        )}
      </div>
    </div>
  )
}

export default SearchPreview

