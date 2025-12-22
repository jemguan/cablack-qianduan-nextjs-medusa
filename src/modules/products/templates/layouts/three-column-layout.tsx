import React, { Suspense } from "react"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import ProductImageCarouselClient from "@modules/products/components/product-image-carousel-client"
import ProductActions from "@modules/products/components/product-actions"
import ProductActionsWrapper from "../product-actions-wrapper"
import ConditionalPrice from "@modules/products/components/product-price/conditional-price"
import ProductTabs from "@modules/products/components/product-tabs"
import ProductPageClientWrapper from "@modules/products/components/product-page-client-wrapper"
import ProductBrandLink from "@modules/products/components/product-brand-link"
import { MedusaConfig } from "@lib/admin-api/config"

type ThreeColumnLayoutProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  images: HttpTypes.StoreProductImage[]
  initialVariantId?: string
  shippingReturnsConfig?: MedusaConfig['shippingReturnsConfig']
}

const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
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
      data-testid="product-container-three-column"
    >
      {/* 左侧：图片区域 */}
      <div className="w-full small:w-2/5 flex-shrink-0">
          <ProductImageCarouselClient
            product={product}
          productTitle={product.title}
        />
      </div>

      {/* 中间：产品信息区域 */}
      <div className="w-full small:flex-1 flex flex-col gap-y-4 small:px-6">
        {/* 产品标题 */}
        <ProductBrandLink 
          productId={product.id}
          className="text-medium text-ui-fg-muted hover:text-ui-fg-subtle"
        />
        <Heading
          level="h1"
          className="text-3xl leading-10 text-ui-fg-base"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        {/* 副标题 */}
        {product.subtitle && (
          <Text
            className="text-lg text-ui-fg-subtle"
            data-testid="product-subtitle"
          >
            {product.subtitle}
          </Text>
        )}

          {/* 产品标签页 */}
          <div className="mt-4">
        {/* 产品描述 */}
        {product.description && (
          <Text
                className="text-medium text-ui-fg-subtle whitespace-pre-line mb-4"
            data-testid="product-description"
          >
            {product.description}
          </Text>
        )}
            <ProductTabs product={product} shippingReturnsConfig={shippingReturnsConfig} />
        </div>
      </div>

      {/* 右侧：价格和操作区域 */}
        <div className="w-full small:w-80 small:flex-shrink-0 flex flex-col gap-y-6">
        {/* 价格 - 只在没有变体选择器或未选择变体时显示 */}
        <div>
          <ConditionalPrice product={product} />
        </div>

        {/* 产品操作区域 */}
        <Suspense
          fallback={
            <ProductActions
              disabled={true}
              product={product}
              region={region}
            />
          }
        >
          <ProductActionsWrapper id={product.id} region={region} />
        </Suspense>
      </div>
    </div>
    </ProductPageClientWrapper>
  )
}

export default ThreeColumnLayout

