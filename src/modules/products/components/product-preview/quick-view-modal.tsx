"use client"

import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react"
import { XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Fragment, useState, useMemo, useEffect } from "react"
import { isEqual } from "lodash"
import VariantSelector from "./variant-selector"
import QuickAddButton from "./quick-add-button"
import ProductPrice from "../product-price"
import { getProductPrice } from "@lib/util/get-product-price"
import { Text, Button } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductImageCarousel from "./product-image-carousel"
import ProductBrandLink from "../product-brand-link"
import { ProductQuantitySelector } from "../quantity-selector"
import { addToCart } from "@lib/data/cart"
import { useParams, useRouter } from "next/navigation"

type QuickViewModalProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  isOpen: boolean
  onClose: () => void
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  region,
  isOpen,
  onClose,
}) => {
  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const router = useRouter()
  const params = useParams()
  const countryCode = params?.countryCode as string

  // Initialize options if product has only one variant
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return null
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  const handleOptionChange = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  // 当变体变化时，重置数量为1
  useEffect(() => {
    setQuantity(1)
  }, [selectedVariant?.id])

  // 计算最大可选数量（基于库存）
  const maxQuantity = useMemo(() => {
    if (!selectedVariant) return 99
    if (!selectedVariant.manage_inventory) return 99
    if (selectedVariant.allow_backorder) return 99
    return Math.min(selectedVariant.inventory_quantity || 99, 99)
  }, [selectedVariant])

  // 检查变体是否有库存
  const inStock = useMemo(() => {
    if (!selectedVariant) return false
    if (!selectedVariant.manage_inventory) return true
    if (selectedVariant.allow_backorder) return true
    return (selectedVariant.inventory_quantity || 0) > 0
  }, [selectedVariant])

  // 检查选中的变体是否有效
  const isValidVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return false
    return product.variants.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // 处理加入购物车
  const handleAddToCart = async () => {
    if (!selectedVariant?.id || !inStock || !isValidVariant) {
      return
    }

    setIsAdding(true)

    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity,
        countryCode,
      })

      router.refresh()
      // 可以在这里添加成功提示或关闭模态框
    } catch (error) {
      console.error("Failed to add to cart:", error)
    } finally {
      setIsAdding(false)
    }
  }

  // Get images for selected variant (same logic as product preview card)
  const displayImages = useMemo(() => {
    const allImages = product.images || []
    
    // If no variant selected, return all product images
    if (!selectedVariant || !product.variants) {
      return allImages.length > 0 ? allImages : (product.thumbnail ? [{ url: product.thumbnail }] : [])
    }

    // Check if variant has images
    if (!selectedVariant.images || selectedVariant.images.length === 0) {
      // No variant images, return first product image
      return allImages.length > 0 ? [allImages[0]] : (product.thumbnail ? [{ url: product.thumbnail }] : [])
    }

    // If variant has images, filter product images by variant image IDs
    // Create a map of image ID to image object for quick lookup
    const imageMap = new Map(allImages.map((img) => [img.id, img]))
    
    // Build variant images array in the order specified by variant.images
    let variantImages = selectedVariant.images
      .map((variantImg: any) => imageMap.get(variantImg.id))
      .filter((img: any) => img !== undefined) // Remove any images not found in product.images
    
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
    return allImages.length > 0 ? [allImages[0]] : (product.thumbnail ? [{ url: product.thumbnail }] : [])
  }, [product.images, product.thumbnail, product.variants, selectedVariant])


  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-6xl max-h-[90vh] bg-background rounded-xl shadow-2xl overflow-hidden flex flex-col border border-border">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <DialogTitle className="text-lg font-semibold text-foreground">
                  Quick View
                </DialogTitle>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <XMark className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                  {/* Left: Image Gallery */}
                  <div className="flex flex-col gap-4">
                    <ProductImageCarousel
                      key={`carousel-${selectedVariant?.id || 'default'}-${displayImages[0]?.id || 0}`}
                      images={displayImages}
                      productTitle={product.title}
                      variantId={selectedVariant?.id}
                    />
                  </div>

                  {/* Right: Product Info */}
                  <div className="flex flex-col gap-6">
                    {/* Product Title */}
                    <div>
                      <ProductBrandLink productId={product.id} />
                      <h2 className="text-2xl font-bold text-foreground mt-1">
                        {product.title}
                      </h2>
                    </div>

                    {/* Price */}
                    <div>
                      <ProductPrice product={product} variant={selectedVariant || undefined} />
                    </div>

                    {/* Description */}
                    {product.description && (
                      <div>
                        <Text className="text-sm text-muted-foreground whitespace-pre-line">
                          {product.description}
                        </Text>
                      </div>
                    )}

                    {/* Variant Selector */}
                    {product.variants && product.variants.length > 1 && (
                      <div>
                        <VariantSelector
                          product={product}
                          options={options}
                          onOptionChange={handleOptionChange}
                        />
                      </div>
                    )}

                    {/* Quantity Selector */}
                    {selectedVariant && isValidVariant && (
                      <div>
                        <ProductQuantitySelector
                          quantity={quantity}
                          onQuantityChange={setQuantity}
                          minQuantity={1}
                          maxQuantity={maxQuantity}
                          showLabel={true}
                          size="md"
                          disabled={isAdding || !inStock}
                        />
                      </div>
                    )}

                    {/* Add to Cart Button */}
                    <div>
                      <Button
                        onClick={handleAddToCart}
                        disabled={
                          !inStock ||
                          !selectedVariant ||
                          isAdding ||
                          !isValidVariant
                        }
                        variant="primary"
                        className="w-full h-10"
                        isLoading={isAdding}
                      >
                        {!selectedVariant || !isValidVariant
                          ? "Select variant"
                          : !inStock
                          ? "Out of stock"
                          : "Add to cart"}
                      </Button>
                    </div>

                    {/* View Full Details Link */}
                    <div>
                      <LocalizedClientLink
                        href={`/products/${product.handle}`}
                        onClick={onClose}
                        className="text-sm text-primary hover:underline"
                      >
                        View full product details →
                      </LocalizedClientLink>
                    </div>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}

export default QuickViewModal

