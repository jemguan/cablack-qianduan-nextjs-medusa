"use client"

import React, { useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import ProductImageCarousel from "@modules/products/components/product-preview/product-image-carousel"
import { useVariantSelection } from "@modules/products/contexts/variant-selection-context"

type ProductImageCarouselClientProps = {
  product: HttpTypes.StoreProduct
  productTitle?: string
}

const ProductImageCarouselClient: React.FC<ProductImageCarouselClientProps> = ({
  product,
  productTitle,
}) => {
  const { selectedVariant } = useVariantSelection()

  // Get images for selected variant - always show all images, but reorder variant images to front
  const displayImages = useMemo(() => {
    const allImages = product.images || []
    
    // If no images, return thumbnail if available
    if (allImages.length === 0) {
      return product.thumbnail ? [{ id: 'thumbnail', url: product.thumbnail }] : []
    }
    
    // If no variant selected, return all product images as-is
    if (!selectedVariant || !product.variants || !selectedVariant.images || selectedVariant.images.length === 0) {
      return allImages
    }

    // Get variant-specific images
    const variantImageIds = new Set(selectedVariant.images.map((img: any) => img.id))
    const variantImages: typeof allImages = []
    const otherImages: typeof allImages = []
    
    // Separate variant images from other images
    allImages.forEach((img) => {
      if (variantImageIds.has(img.id)) {
        variantImages.push(img)
      } else {
        otherImages.push(img)
      }
    })
    
    // Find variant-specific images (images that appear in fewer variants)
    // Count how many variants each image appears in
    const imageVariantCount = new Map<string, number>()
    product.variants?.forEach((v) => {
      v.images?.forEach((img: any) => {
        const count = imageVariantCount.get(img.id) || 0
        imageVariantCount.set(img.id, count + 1)
      })
    })
    
    // Sort variant images: variant-specific first, then others maintaining original order
    const variantSpecificImages: typeof variantImages = []
    const commonImages: typeof variantImages = []
    const otherVariantImages: typeof variantImages = []
    
    variantImages.forEach((img) => {
      if (!img?.id) return
      const count = imageVariantCount.get(img.id) || 0
      const totalVariants = product.variants?.length || 1
      
      if (count === 1) {
        // Variant-specific (only appears in this variant)
        variantSpecificImages.push(img)
      } else if (count === totalVariants) {
        // Common to all variants
        commonImages.push(img)
      } else {
        // Appears in some but not all variants
        otherVariantImages.push(img)
      }
    })
    
    // Reorder variant images: variant-specific first, then others, then common
    const reorderedVariantImages = [...variantSpecificImages, ...otherVariantImages, ...commonImages]
    
    // Return: variant images first, then all other images
    return [...reorderedVariantImages, ...otherImages]
  }, [product.images, product.thumbnail, product.variants, selectedVariant])

  // Convert images to the format expected by ProductImageCarousel
  const carouselImages = displayImages.map((img) => ({
    id: img.id || 'image',
    url: img.url,
  }))

  return (
    <ProductImageCarousel
      images={carouselImages}
      productTitle={productTitle || product.title}
      variantId={selectedVariant?.id}
    />
  )
}

export default ProductImageCarouselClient

