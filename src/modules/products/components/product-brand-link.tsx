import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Brand } from "@lib/data/brands"

type ProductBrandLinkProps = {
  productId?: string
  className?: string
  // 从父组件传入，避免重复 API 请求
  brand?: Brand | null
}

const ProductBrandLink = ({
  productId,
  className = "text-sm text-muted-foreground hover:text-primary transition-colors",
  brand,
}: ProductBrandLinkProps) => {
  if (!brand) {
    return null
  }

  // 如果 slug 为空，使用 id 作为后备
  const brandIdentifier = brand.slug || brand.id

  return (
    <LocalizedClientLink
      href={`/brands/${brandIdentifier}`}
      className={`${className} cursor-pointer`}
    >
      {brand.name}
    </LocalizedClientLink>
  )
}

export default ProductBrandLink

