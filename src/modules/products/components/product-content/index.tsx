import React from "react"
import { HttpTypes } from "@medusajs/types"
import { MedusaConfig } from "@lib/admin-api/config"
import TwoColumnLayout from "../../templates/layouts/two-column-layout"
import ThreeColumnLayout from "../../templates/layouts/three-column-layout"

type ProductContentProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  images: HttpTypes.StoreProductImage[]
  initialVariantId?: string
  layout?: 'two-column' | 'three-column'
  shippingReturnsConfig?: MedusaConfig['shippingReturnsConfig']
}

const ProductContent: React.FC<ProductContentProps> = ({
  product,
  region,
  images,
  initialVariantId,
  layout = 'two-column',
  shippingReturnsConfig,
}) => {
  if (layout === 'three-column') {
    return (
      <ThreeColumnLayout
        product={product}
        region={region}
        images={images}
        initialVariantId={initialVariantId}
        shippingReturnsConfig={shippingReturnsConfig}
      />
    )
  }

  return (
    <TwoColumnLayout
      product={product}
      region={region}
      images={images}
      initialVariantId={initialVariantId}
      shippingReturnsConfig={shippingReturnsConfig}
    />
  )
}

export default ProductContent

