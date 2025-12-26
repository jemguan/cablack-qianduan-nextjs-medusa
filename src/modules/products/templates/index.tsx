import React, { Suspense } from "react"

import RelatedProducts from "@modules/products/components/related-products"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { getMedusaConfig } from "@lib/admin-api/config"
import { getProductPageLayoutBlocks } from "../utils/getProductPageLayoutBlocks"
import ProductContent from "../components/product-content"
import { FAQBlock } from "@modules/home/components/faq-block"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
  initialVariantId?: string
}

const ProductTemplate: React.FC<ProductTemplateProps> = async ({
  product,
  region,
  countryCode,
  images,
  initialVariantId,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  // 获取配置
  const config = await getMedusaConfig()

  // 根据 pageLayouts 配置获取产品页 blocks
  const pageBlocks = getProductPageLayoutBlocks(
    config,
    product,
    region,
    images,
    initialVariantId
  )

  // 组件映射
  const componentMap: Record<string, React.ComponentType<any>> = {
    ProductContent,
    FAQBlock,
    // 可以在这里添加更多组件映射
  }

  return (
    <>
      {/* 根据配置动态渲染 blocks */}
      {pageBlocks.map((blockConfig) => {
        if (!blockConfig.enabled || !blockConfig.componentName) {
          return null
        }

        const Component = componentMap[blockConfig.componentName]
        if (!Component) {
          console.warn(
            `[Medusa ProductPage] Unknown component: ${blockConfig.componentName}`
          )
          return null
        }

        return (
          <Component key={blockConfig.id} {...blockConfig.props} />
        )
      })}

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
