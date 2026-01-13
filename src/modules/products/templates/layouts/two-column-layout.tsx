"use client"

import React, { useRef } from "react"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import ProductImageCarouselClient from "@modules/products/components/product-image-carousel-client"
import ProductInfo from "@modules/products/templates/product-info"
import ProductActions from "@modules/products/components/product-actions"
import ProductTabs from "@modules/products/components/product-tabs"
import ProductPageClientWrapper from "@modules/products/components/product-page-client-wrapper"
import { StickyAddToCart } from "@modules/products/components/sticky-add-to-cart"
import { MedusaConfig } from "@lib/admin-api/config"
import ProductDescriptionAccordion from "@modules/products/components/product-description-accordion"
import { LoyaltyAccount } from "@/types/loyalty"
import type { OptionTemplate } from "@lib/data/option-templates"

type TwoColumnLayoutProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  images: HttpTypes.StoreProductImage[]
  initialVariantId?: string
  shippingReturnsConfig?: MedusaConfig['shippingReturnsConfig']
  htmlDescription?: string | null
  /** 当前登录的客户 */
  customer?: HttpTypes.StoreCustomer | null
  /** 积分账户信息 */
  loyaltyAccount?: LoyaltyAccount | null
  /** 会员产品 ID 列表 */
  membershipProductIds?: Record<string, boolean> | null
  /** 选项模板列表 */
  optionTemplates?: OptionTemplate[]
}

const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
  product,
  region,
  images,
  initialVariantId,
  shippingReturnsConfig,
  htmlDescription,
  customer,
  loyaltyAccount,
  membershipProductIds,
  optionTemplates = [],
}) => {
  const actionsRef = useRef<HTMLDivElement>(null)
  const mobileActionsRef = useRef<HTMLDivElement>(null)

  // 调试：检查 htmlDescription 是否正确传递
  if (process.env.NODE_ENV === 'development') {
    console.log('[TwoColumnLayout] htmlDescription:', htmlDescription ? 'exists' : 'null/undefined', htmlDescription?.substring(0, 100))
  }

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
        
        {/* 移动端：在副标题下显示操作区域（变体选择、数量选择、按钮） */}
        <div className="small:hidden mt-4" ref={mobileActionsRef}>
          <ProductActions
            product={product}
            region={region}
            mobileLayout={true}
            customer={customer}
            loyaltyAccount={loyaltyAccount}
            membershipProductIds={membershipProductIds}
            optionTemplates={optionTemplates}
          />
        </div>

        {/* 桌面端：正常位置显示操作区域 */}
        <div className="hidden small:block" ref={actionsRef}>
          <ProductActions
            product={product}
            region={region}
            customer={customer}
            loyaltyAccount={loyaltyAccount}
            membershipProductIds={membershipProductIds}
            optionTemplates={optionTemplates}
          />
        </div>

          {/* 产品描述 - 优先显示 HTML 描述（带折叠功能），如果没有则显示普通描述 */}
          {htmlDescription && htmlDescription.trim() ? (
            <ProductDescriptionAccordion htmlDescription={htmlDescription} />
          ) : product.description ? (
            <Text
              className="text-medium text-ui-fg-subtle whitespace-pre-line"
              data-testid="product-description"
            >
              {product.description}
            </Text>
          ) : null}

        {/* 产品标签页 */}
          <ProductTabs product={product} shippingReturnsConfig={shippingReturnsConfig} />
        </div>
      </div>

      {/* 粘性购物栏 */}
      <StickyAddToCart
        product={product}
        region={region}
        triggerRef={actionsRef}
        mobileTriggerRef={mobileActionsRef}
        customer={customer}
        loyaltyAccount={loyaltyAccount}
        membershipProductIds={membershipProductIds}
      />
    </ProductPageClientWrapper>
  )
}

export default TwoColumnLayout


