import React, { Suspense } from "react"
import { HttpTypes } from "@medusajs/types"
import ProductImageCarousel from "@modules/products/components/product-preview/product-image-carousel"
import ProductInfo from "@modules/products/templates/product-info"
import ProductActions from "@modules/products/components/product-actions"
import ProductActionsWrapper from "../product-actions-wrapper"
import ProductTabs from "@modules/products/components/product-tabs"

type TwoColumnLayoutProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  images: HttpTypes.StoreProductImage[]
}

const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
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
      data-testid="product-container-two-column"
    >
      {/* 左侧：图片区域 */}
      <div className="w-full small:w-1/2 flex-shrink-0">
        <ProductImageCarousel
          images={carouselImages}
          productTitle={product.title}
          variantId={selectedVariantId}
        />
      </div>

      {/* 右侧：产品信息区域 */}
      <div className="w-full small:w-1/2 flex flex-col gap-y-6 small:sticky small:top-48">
        {/* 产品基本信息 */}
        <ProductInfo product={product} />

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

        {/* 产品标签页 */}
        <ProductTabs product={product} />
      </div>
    </div>
  )
}

export default TwoColumnLayout

