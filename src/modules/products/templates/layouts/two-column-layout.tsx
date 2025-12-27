import React from "react"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import ProductImageCarouselClient from "@modules/products/components/product-image-carousel-client"
import ProductInfo from "@modules/products/templates/product-info"
import ProductActions from "@modules/products/components/product-actions"
import ProductTabs from "@modules/products/components/product-tabs"
import ProductPageClientWrapper from "@modules/products/components/product-page-client-wrapper"
import { MedusaConfig } from "@lib/admin-api/config"

type TwoColumnLayoutProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  images: HttpTypes.StoreProductImage[]
  initialVariantId?: string
  shippingReturnsConfig?: MedusaConfig['shippingReturnsConfig']
}

const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
  product,
  region,
  images,
  initialVariantId,
  shippingReturnsConfig,
}) => {
  return (
    <ProductPageClientWrapper product={product} initialVariantId={initialVariantId}>
    <div
      className="content-container flex flex-col small:flex-row small:items-start gap-6 py-6"
      data-testid="product-container-two-column"
    >
      {/* 左侧：图片区域 */}
        <div className="w-full small:w-1/2 flex-shrink-0 small:self-start">
          <ProductImageCarouselClient
            product={product}
          productTitle={product.title}
        />
      </div>

      {/* 右侧：产品信息区域 */}
        <div className="w-full small:w-1/2 flex flex-col gap-y-6 small:self-start">
        {/* 产品基本信息 */}
        <ProductInfo product={product} />

        {/* 产品操作区域 */}
        <ProductActions
          product={product}
          region={region}
        />

          {/* 产品描述 */}
          {product.description && (
            <Text
              className="text-medium text-ui-fg-subtle whitespace-pre-line"
              data-testid="product-description"
            >
              {product.description}
            </Text>
          )}

        {/* 产品标签页 */}
          <ProductTabs product={product} shippingReturnsConfig={shippingReturnsConfig} />
        </div>
      </div>
    </ProductPageClientWrapper>
  )
}

export default TwoColumnLayout


