"use client"

import React, { useRef } from "react"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import ProductImageCarouselClient from "@modules/products/components/product-image-carousel-client"
import ProductActions from "@modules/products/components/product-actions"
import ConditionalPrice from "@modules/products/components/product-price/conditional-price"
import ProductTabs from "@modules/products/components/product-tabs"
import ProductPageClientWrapper from "@modules/products/components/product-page-client-wrapper"
import ProductBrandLink from "@modules/products/components/product-brand-link"
import { StickyAddToCart } from "@modules/products/components/sticky-add-to-cart"
import { MedusaConfig } from "@lib/admin-api/config"
import ProductRating from "@modules/products/components/reviews/ProductRating"
import ProductDescriptionAccordion from "@modules/products/components/product-description-accordion"

type ThreeColumnLayoutProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  images: HttpTypes.StoreProductImage[]
  initialVariantId?: string
  shippingReturnsConfig?: MedusaConfig['shippingReturnsConfig']
  htmlDescription?: string | null
}

const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
  product,
  region,
  images,
  initialVariantId,
  shippingReturnsConfig,
  htmlDescription,
}) => {
  const actionsRef = useRef<HTMLDivElement>(null)
  const mobileActionsRef = useRef<HTMLDivElement>(null)

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
            className="text-lg font-light text-red-600"
            data-testid="product-subtitle"
          >
            {product.subtitle}
          </Text>
        )}

        {/* Product Rating */}
        <ProductRating productId={product.id} size="md" showCount={true} />

        {/* 移动端：在副标题下显示操作区域（变体选择、数量选择、按钮） */}
        <div className="small:hidden mt-4" ref={mobileActionsRef}>
          <ProductActions
            product={product}
            region={region}
            mobileLayout={true}
          />
        </div>

          {/* 产品标签页 */}
          <div className="mt-4">
        {/* 产品描述 - 优先显示 HTML 描述（带折叠功能），如果没有则显示普通描述 */}
        {htmlDescription ? (
          <div className="mb-4">
            <ProductDescriptionAccordion htmlDescription={htmlDescription} />
          </div>
        ) : product.description ? (
          <Text
            className="text-medium text-ui-fg-subtle whitespace-pre-line mb-4"
            data-testid="product-description"
          >
            {product.description}
          </Text>
        ) : null}
            <ProductTabs product={product} shippingReturnsConfig={shippingReturnsConfig} />
        </div>
      </div>

      {/* 右侧：价格和操作区域（桌面端） */}
        <div className="hidden small:flex w-full small:w-80 small:flex-shrink-0 flex-col gap-y-6">
        {/* 价格 - 只在没有变体选择器或未选择变体时显示 */}
        <div>
          <ConditionalPrice product={product} />
        </div>

        {/* 产品操作区域 - 桌面端也使用同一个 ref */}
        <div ref={actionsRef}>
          <ProductActions
            product={product}
            region={region}
          />
        </div>
      </div>
    </div>

      {/* 粘性购物栏 */}
      <StickyAddToCart
        product={product}
        region={region}
        triggerRef={actionsRef}
        mobileTriggerRef={mobileActionsRef}
      />
    </ProductPageClientWrapper>
  )
}

export default ThreeColumnLayout

