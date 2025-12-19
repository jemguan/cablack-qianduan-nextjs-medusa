import React, { Suspense } from "react"

import RelatedProducts from "@modules/products/components/related-products"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { getMedusaConfig } from "@lib/admin-api/config"
import TwoColumnLayout from "./layouts/two-column-layout"
import ThreeColumnLayout from "./layouts/three-column-layout"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = async ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  // 获取配置
  const config = await getMedusaConfig()
  const productPageConfig = config?.productPageConfig

  // 确定布局类型，默认为 two-column
  const layout = productPageConfig?.layout || 'two-column'
  const isEnabled = productPageConfig?.enabled !== false

  // 如果禁用，使用默认布局
  const finalLayout = isEnabled ? layout : 'two-column'

  return (
    <>
      {/* 根据配置选择布局 */}
      {finalLayout === 'three-column' ? (
        <ThreeColumnLayout
          product={product}
          region={region}
          images={images}
        />
      ) : (
        <TwoColumnLayout
          product={product}
          region={region}
          images={images}
        />
      )}

      {/* 相关产品 */}
      <div
        className="content-container my-16 small:my-32"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
