"use client"

import React from "react"
import { OptionTemplateSelectionProvider } from "@modules/products/contexts/option-template-selection-context"
import ProductTemplateInner from "./product-template-inner"
import type { HttpTypes } from "@medusajs/types"
import type { OptionTemplate } from "@lib/data/option-templates"
import type { MedusaConfig } from "@lib/admin-api/config"

type ProductTemplateWrapperProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
  initialVariantId?: string
  htmlDescription?: string | null
  optionTemplates?: OptionTemplate[]
  customer?: HttpTypes.StoreCustomer | null
  loyaltyAccount?: any
  membershipProductIds?: Record<string, boolean> | null
  medusaConfig?: MedusaConfig | null
}

export default function ProductTemplateWrapper({
  product,
  region,
  countryCode,
  images,
  initialVariantId,
  htmlDescription,
  optionTemplates = [],
  customer,
  loyaltyAccount,
  membershipProductIds,
  medusaConfig,
}: ProductTemplateWrapperProps) {
  return (
    <OptionTemplateSelectionProvider>
      <ProductTemplateInner
        product={product}
        region={region}
        countryCode={countryCode}
        images={images}
        initialVariantId={initialVariantId}
        htmlDescription={htmlDescription}
        optionTemplates={optionTemplates}
        customer={customer}
        loyaltyAccount={loyaltyAccount}
        membershipProductIds={membershipProductIds}
        medusaConfig={medusaConfig}
      />
    </OptionTemplateSelectionProvider>
  )
}
