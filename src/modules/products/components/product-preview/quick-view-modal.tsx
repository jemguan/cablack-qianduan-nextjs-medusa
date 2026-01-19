"use client"

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
} from "@headlessui/react"
import { XMark } from "@medusajs/icons"
import { Fragment, useMemo } from "react"
import { Text } from "@medusajs/ui"
import VariantSelector from "./variant-selector"
import ProductPrice from "../product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductImageCarousel from "./product-image-carousel"
import ProductBrandLink from "../product-brand-link"
import { ProductQuantitySelector } from "../quantity-selector"

import type { QuickViewModalProps } from "./quick-view/types"
import { getVariantImages } from "./quick-view/utils"
import { useQuickViewState, useQuickViewActions } from "./quick-view/hooks"
import { AddToCartButton } from "./quick-view/components"

const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  region,
  isOpen,
  onClose,
  customer,
  loyaltyAccount,
  membershipProductIds,
}) => {
  // 使用自定义 hooks 管理状态
  const {
    options,
    quantity,
    setQuantity,
    selectedVariant,
    maxQuantity,
    inStock,
    isValidVariant,
    isMembershipProduct,
    isVip,
    isLoggedIn,
    handleOptionChange,
  } = useQuickViewState({
    product,
    customer,
    loyaltyAccount,
    membershipProductIds,
  })

  // 使用自定义 hooks 管理操作
  const {
    isAdding,
    isTogglingNotify,
    isNotifyLoading,
    isSubscribed,
    handleNotifyMe,
    handleAddToCart,
    handleLoginRequired,
  } = useQuickViewActions({
    product,
    selectedVariant,
    quantity,
    inStock,
    isValidVariant,
    customer,
    onClose,
  })

  // 获取显示的图片
  const displayImages = useMemo(
    () => getVariantImages(product, selectedVariant),
    [product, selectedVariant]
  )

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
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
          />
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
                      key={`carousel-${selectedVariant?.id || "default"}-${(displayImages[0] as { id?: string })?.id || 0}`}
                      images={displayImages as { id?: string; url: string }[]}
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
                      <ProductPrice
                        product={product}
                        variant={selectedVariant || undefined}
                      />
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
                      <AddToCartButton
                        selectedVariant={selectedVariant}
                        isValidVariant={isValidVariant}
                        inStock={inStock}
                        isAdding={isAdding}
                        isMembershipProduct={isMembershipProduct}
                        isLoggedIn={isLoggedIn}
                        isVip={isVip}
                        isSubscribed={isSubscribed}
                        isTogglingNotify={isTogglingNotify}
                        isNotifyLoading={isNotifyLoading}
                        onAddToCart={handleAddToCart}
                        onNotifyMe={handleNotifyMe}
                        onLoginRequired={handleLoginRequired}
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
