"use client"

import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react"
import { XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Fragment, useState, useMemo, useEffect } from "react"
import { isEqual } from "lodash"
import Image from "next/image"
import { getImageUrl } from "@lib/util/image"
import VariantSelector from "./variant-selector"
import QuickAddButton from "./quick-add-button"
import ProductPrice from "../product-price"
import { getProductPrice } from "@lib/util/get-product-price"
import { Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // Initialize options if product has only one variant
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  // Reset image index when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedImageIndex(0)
    }
  }, [isOpen])

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

  const images = product.images || []
  const displayImages = images.length > 0 ? images : (product.thumbnail ? [{ url: product.thumbnail }] : [])

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
                    {/* Main Image */}
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-ui-bg-subtle shadow-lg">
                      {displayImages.length > 0 && displayImages[selectedImageIndex] && (
                        <Image
                          src={getImageUrl(displayImages[selectedImageIndex].url)}
                          alt={product.title || "Product image"}
                          fill
                          className="object-cover transition-opacity duration-300"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          priority
                        />
                      )}
                    </div>

                    {/* Thumbnail Images */}
                    {displayImages.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {displayImages.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`
                              relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all hover:scale-105
                              ${selectedImageIndex === index 
                                ? 'border-primary ring-2 ring-primary ring-offset-2 shadow-md' 
                                : 'border-border hover:border-primary/50 hover:shadow-sm'
                              }
                            `}
                          >
                            <Image
                              src={getImageUrl(image.url)}
                              alt={`Thumbnail ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Product Info */}
                  <div className="flex flex-col gap-6">
                    {/* Product Title */}
                    <div>
                      {product.collection && (
                        <LocalizedClientLink
                          href={`/collections/${product.collection.handle}`}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {product.collection.title}
                        </LocalizedClientLink>
                      )}
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

                    {/* Add to Cart Button */}
                    <div>
                      <QuickAddButton
                        product={product}
                        selectedVariant={selectedVariant || undefined}
                        options={options}
                      />
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

