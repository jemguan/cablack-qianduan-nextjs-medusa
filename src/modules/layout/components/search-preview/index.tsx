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
  isLoading: boolean
  onClose: () => void
  onProductClick: (searchTerm: string) => void
}

const SearchPreview = ({
  products,
  searchTerm,
  isLoading,
  onClose,
  onProductClick,
}: SearchPreviewProps) => {
  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-[9999] max-h-96 overflow-y-auto">
        <div className="p-4 text-center text-sm text-muted-foreground">
          Searching...
        </div>
      </div>
    )
  }

  if (products.length === 0 && searchTerm.trim()) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-[9999]">
        <div className="p-4 text-center">
          <p className="text-sm text-muted-foreground">No products found</p>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  const handleProductClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onProductClick(searchTerm)
    onClose()
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-[9999] max-h-96 overflow-y-auto">
      <div className="p-2">
        {products.map((product) => {
          const { cheapestPrice } = getProductPrice({ product })

          return (
            <button
              key={product.id}
              onClick={handleProductClick}
              className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-md transition-colors group text-left"
            >
              <div className="flex-shrink-0 w-16 h-16 relative overflow-hidden rounded-md bg-ui-bg-subtle">
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
                <Text className="text-sm font-medium text-foreground group-hover:text-primary line-clamp-1">
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
      </div>
    </div>
  )
}

export default SearchPreview

