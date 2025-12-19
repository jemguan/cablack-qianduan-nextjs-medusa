import React, { Suspense } from "react"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductImageCarousel from "@modules/products/components/product-preview/product-image-carousel"
import ProductActions from "@modules/products/components/product-actions"
import ProductActionsWrapper from "../product-actions-wrapper"
import ProductPrice from "@modules/products/components/product-price"
import ProductTabs from "@modules/products/components/product-tabs"

type ThreeColumnLayoutProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  images: HttpTypes.StoreProductImage[]
}

const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
  product,
  region,
  images,
}) => {
  // 转换图片格式以匹配 ProductImageCarousel 的期望格式
  const carouselImages = images.map((img) => ({
    id: img.id,
    url: img.url,
  }))

  // 获取当前选中的变体 ID（如果有）
  const selectedVariantId = product.variants?.[0]?.id

  return (
    <div
      className="content-container flex flex-col small:flex-row small:items-start gap-6 py-6"
      data-testid="product-container-three-column"
    >
      {/* 左侧：图片区域 */}
      <div className="w-full small:w-2/5 flex-shrink-0">
        <ProductImageCarousel
          images={carouselImages}
          productTitle={product.title}
          variantId={selectedVariantId}
        />
      </div>

      {/* 中间：产品信息区域 */}
      <div className="w-full small:flex-1 flex flex-col gap-y-4 small:px-6">
        {/* 产品标题 */}
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-medium text-ui-fg-muted hover:text-ui-fg-subtle"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
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
        <div className="mt-4">
          <ProductTabs product={product} />
        </div>
      </div>

      {/* 右侧：价格和操作区域 */}
      <div className="w-full small:w-80 small:flex-shrink-0 flex flex-col gap-y-6 small:sticky small:top-48">
        {/* 价格 */}
        <div>
          <ProductPrice product={product} />
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
  )
}

export default ThreeColumnLayout

