import React from "react"

import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { getProductPageLayoutBlocks } from "../utils/getProductPageLayoutBlocks"
import ProductContent from "../components/product-content"
import { FAQBlock } from "@modules/home/components/faq-block"
import { RecentlyViewedProductsBlock, ProductViewTracker } from "../components/recently-viewed-products"
import { BundleSaleBlock } from "../components/bundle-sale/BundleSaleBlock"
import { ReviewsBlock } from "../components/reviews/ReviewsBlock"
import { BannerBlock } from "@modules/home/components/banner-block"

import type { OptionTemplate } from "@lib/data/option-templates"
import type { MedusaConfig } from "@lib/admin-api/config"

type ProductTemplateInnerProps = {
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

const ProductTemplateInner: React.FC<ProductTemplateInnerProps> = ({
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
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  // 根据 pageLayouts 配置获取产品页 blocks
  const pageBlocks = getProductPageLayoutBlocks(
    medusaConfig,
    product,
    region,
    images,
    initialVariantId,
    countryCode,
    htmlDescription,
    customer,
    loyaltyAccount,
    membershipProductIds,
    optionTemplates
  )

  // 组件映射
  const componentMap: Record<string, React.ComponentType<any>> = {
    ProductContent,
    FAQBlock,
    RecentlyViewedProductsBlock,
    BundleSaleBlock,
    ReviewsBlock,
    BannerBlock,
  }

  return (
    <>
      {/* 产品浏览追踪 - 自动记录到浏览历史 */}
      <ProductViewTracker product={product} />

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
    </>
  )
}

export default ProductTemplateInner
