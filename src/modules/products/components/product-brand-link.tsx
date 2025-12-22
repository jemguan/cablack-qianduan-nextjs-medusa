"use client"

import { useState, useEffect } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getProductBrand } from "@lib/data/brands"
import { Brand } from "@lib/data/brands"

type ProductBrandLinkProps = {
  productId: string
  className?: string
}

const ProductBrandLink = ({ productId, className = "text-sm text-muted-foreground hover:text-primary transition-colors" }: ProductBrandLinkProps) => {
  const [brand, setBrand] = useState<Brand | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const brandData = await getProductBrand(productId)
        setBrand(brandData)
      } catch (error) {
        setBrand(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (productId) {
      fetchBrand()
    }
  }, [productId])

  if (isLoading) {
    return null
  }

  if (!brand) {
    return null
  }

  // 如果 slug 为空，使用 id 作为后备
  const brandIdentifier = brand.slug || brand.id

  return (
    <LocalizedClientLink
      href={`/brand/${brandIdentifier}`}
      className={`${className} cursor-pointer`}
    >
      {brand.name}
    </LocalizedClientLink>
  )
}

export default ProductBrandLink

