import { useMemo } from "react"
import { HttpTypes } from "@medusajs/types"

type ProductImage = {
  id?: string
  url?: string
}

type VariantImage = {
  id: string
}

/**
 * Hook 用于获取产品展示图片
 * 根据选中的变体返回对应的图片列表
 */
export function useProductImages(
  product: HttpTypes.StoreProduct,
  selectedVariant: HttpTypes.StoreProductVariant | null
): ProductImage[] {
  return useMemo(() => {
    const allImages = product.images || []

    // If no variant selected, return all product images
    if (!selectedVariant || !product.variants) {
      return allImages.length > 0
        ? allImages
        : product.thumbnail
          ? [{ url: product.thumbnail }]
          : []
    }

    // Check if variant has images
    if (!selectedVariant.images || selectedVariant.images.length === 0) {
      // No variant images, return first product image
      return allImages.length > 0
        ? [allImages[0]]
        : product.thumbnail
          ? [{ url: product.thumbnail }]
          : []
    }

    // If variant has images, filter product images by variant image IDs
    // Create a map of image ID to image object for quick lookup
    const imageMap = new Map(allImages.map((img) => [img.id, img]))

    // Build variant images array in the order specified by variant.images
    let variantImages = (selectedVariant.images as VariantImage[])
      .map((variantImg) => imageMap.get(variantImg.id))
      .filter((img): img is NonNullable<typeof img> => img !== undefined)

    // Count how many variants each image appears in
    const imageVariantCount = new Map<string, number>()
    product.variants?.forEach((v) => {
      ;(v.images as VariantImage[] | undefined)?.forEach((img) => {
        const count = imageVariantCount.get(img.id) || 0
        imageVariantCount.set(img.id, count + 1)
      })
    })

    // Find variant-specific images (appear in only 1 variant) and common images (appear in all variants)
    const variantSpecificImages: typeof variantImages = []
    const commonImages: typeof variantImages = []
    const otherImages: typeof variantImages = []

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
        otherImages.push(img)
      }
    })

    // Reorder: variant-specific first, then others maintaining original order
    variantImages = [...variantSpecificImages, ...otherImages, ...commonImages]

    // If variant has matching images, return them; otherwise return first product image
    if (variantImages.length > 0) {
      return variantImages
    }

    // Fallback to first product image if variant has no matching images
    return allImages.length > 0
      ? [allImages[0]]
      : product.thumbnail
        ? [{ url: product.thumbnail }]
        : []
  }, [product.images, product.thumbnail, product.variants, selectedVariant])
}
