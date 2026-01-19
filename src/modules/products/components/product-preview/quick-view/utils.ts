/**
 * QuickView 工具函数
 */

import type { HttpTypes } from "@medusajs/types"

/**
 * 将变体选项转换为键值映射
 */
export function optionsAsKeymap(
  variantOptions: HttpTypes.StoreProductVariant["options"]
): Record<string, string> {
  return (
    variantOptions?.reduce(
      (acc: Record<string, string>, varopt: any) => {
        acc[varopt.option_id] = varopt.value
        return acc
      },
      {}
    ) || {}
  )
}

/**
 * 获取变体对应的图片列表
 */
export function getVariantImages(
  product: HttpTypes.StoreProduct,
  selectedVariant: HttpTypes.StoreProductVariant | null | undefined
): Array<{ id?: string; url: string }> {
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
  let variantImages: HttpTypes.StoreProductImage[] = selectedVariant.images
    .map((variantImg: any) => imageMap.get(variantImg.id))
    .filter((img): img is HttpTypes.StoreProductImage => img !== undefined) // Remove any images not found in product.images

  // Find variant-specific images (images that appear in fewer variants)
  // Collect all variant image IDs to find unique ones
  const allVariantImageIds = new Set<string>()
  product.variants?.forEach((v) => {
    v.images?.forEach((img: any) => {
      allVariantImageIds.add(img.id)
    })
  })

  // Count how many variants each image appears in
  const imageVariantCount = new Map<string, number>()
  product.variants?.forEach((v) => {
    v.images?.forEach((img: any) => {
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
}
