"use client"

import React, { ReactNode } from "react"
import { HttpTypes } from "@medusajs/types"
import { VariantSelectionProvider } from "@modules/products/contexts/variant-selection-context"

type ProductPageClientWrapperProps = {
  children: ReactNode
  product: HttpTypes.StoreProduct
  initialVariantId?: string
}

const ProductPageClientWrapper: React.FC<ProductPageClientWrapperProps> = ({
  children,
  product,
  initialVariantId,
}) => {
  return (
    <VariantSelectionProvider product={product} initialVariantId={initialVariantId}>
      {children}
    </VariantSelectionProvider>
  )
}

export default ProductPageClientWrapper

