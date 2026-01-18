import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import ProductBrandLink from "@modules/products/components/product-brand-link"
import ProductRating from "@modules/products/components/reviews/ProductRating"
import type { Brand } from "@lib/data/brands"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
  // 从父组件传入，避免重复 API 请求
  brand?: Brand | null
}

const ProductInfo = ({ product, brand }: ProductInfoProps) => {
  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-4">
        <ProductBrandLink 
          productId={product.id}
          className="text-medium text-ui-fg-muted hover:text-ui-fg-subtle"
          brand={brand}
        />
        <Heading
          level="h2"
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
      </div>
    </div>
  )
}

export default ProductInfo
