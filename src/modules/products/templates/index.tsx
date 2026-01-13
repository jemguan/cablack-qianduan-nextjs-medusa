import React from "react"

import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { getMedusaConfig } from "@lib/admin-api/config"
import { getProductPageLayoutBlocks } from "../utils/getProductPageLayoutBlocks"
import ProductContent from "../components/product-content"
import { FAQBlock } from "@modules/home/components/faq-block"
import { RecentlyViewedProductsBlock, ProductViewTracker } from "../components/recently-viewed-products"
import { BundleSaleBlock } from "../components/bundle-sale/BundleSaleBlock"
import { ReviewsBlock } from "../components/reviews/ReviewsBlock"
import { BannerBlock } from "@modules/home/components/banner-block"
import { retrieveCustomer } from "@lib/data/customer"
import { getLoyaltyAccount, getLoyaltyConfig } from "@lib/data/loyalty"

type OptionTemplate = {
  id: string
  title: string
  description?: string | null
  is_active: boolean
  options?: Array<{
    id: string
    label: string
    image_url?: string | null
    hint_text?: string | null
    price_adjustment: number | string
    sort_order: number
  }>
}

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
  initialVariantId?: string
  htmlDescription?: string | null
  optionTemplates?: OptionTemplate[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = async ({
  product,
  region,
  countryCode,
  images,
  initialVariantId,
  htmlDescription,
  optionTemplates = [],
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  // 并行获取配置、客户信息和积分账户
  const [config, customer, loyaltyAccountResponse, loyaltyConfigResponse] = await Promise.all([
    getMedusaConfig(),
    retrieveCustomer(),
    getLoyaltyAccount(),
    getLoyaltyConfig(),
  ])

  // 提取 loyaltyAccount 和 membershipProductIds
  const loyaltyAccount = loyaltyAccountResponse?.account || null
  const membershipProductIds = loyaltyConfigResponse?.config?.membership_product_ids || null

  // 根据 pageLayouts 配置获取产品页 blocks
  const pageBlocks = getProductPageLayoutBlocks(
    config,
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

export default ProductTemplate
