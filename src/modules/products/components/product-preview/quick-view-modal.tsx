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
import { Bell, BellOff } from "lucide-react"
import { useRestockNotify } from "@lib/context/restock-notify-context"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductImageCarousel from "./product-image-carousel"
import ProductBrandLink from "../product-brand-link"
import { ProductQuantitySelector } from "../quantity-selector"
import { addToCart } from "@lib/data/cart"
import { useParams, useRouter } from "next/navigation"
import type { LoyaltyAccount } from "@/types/loyalty"

type QuickViewModalProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  isOpen: boolean
  onClose: () => void
  /** 当前登录的客户 */
  customer?: HttpTypes.StoreCustomer | null
  /** 积分账户信息 */
  loyaltyAccount?: LoyaltyAccount | null
  /** 会员产品 ID 列表 */
  membershipProductIds?: Record<string, boolean> | null
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
  customer,
  loyaltyAccount,
  membershipProductIds,
}) => {
  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [isTogglingNotify, setIsTogglingNotify] = useState(false)
  const params = useParams()
  const countryCode = params?.countryCode as string
  const router = useRouter()
  const { isSubscribedToVariant, toggleRestockSubscription, isLoading: isNotifyLoading } = useRestockNotify()

  // 检查当前产品是否是会员产品
  const isMembershipProduct = useMemo(() => {
    if (!membershipProductIds || !product.id) return false
    return membershipProductIds[product.id] === true
  }, [membershipProductIds, product.id])

  // 检查用户是否是 VIP
  const isVip = useMemo(() => {
    if (!loyaltyAccount) return false
    if (!loyaltyAccount.is_member) return false
    if (!loyaltyAccount.membership_expires_at) return false
    return new Date(loyaltyAccount.membership_expires_at) > new Date()
  }, [loyaltyAccount])

  // 检查用户是否已登录
  const isLoggedIn = !!customer

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

  // 检查当前变体是否已订阅补货通知
  const isSubscribed = useMemo(() => {
    if (!selectedVariant) return false
    return isSubscribedToVariant(selectedVariant.id)
  }, [selectedVariant, isSubscribedToVariant])

  // 处理补货通知订阅/取消订阅
  const handleNotifyMe = async () => {
    if (!selectedVariant) return

    if (!customer) {
      // 未登录，跳转到登录页
      onClose()
      router.push("/account")
      return
    }

    setIsTogglingNotify(true)
    try {
      await toggleRestockSubscription(
        product,
        selectedVariant,
        customer.email || ""
      )
    } catch (error) {
      console.error("Failed to toggle notification:", error)
    } finally {
      setIsTogglingNotify(false)
    }
  }

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

      // addToCart 内部已调用 revalidateTag，无需 router.refresh()
      // 添加成功后关闭模态框
      onClose()
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
                      key={`carousel-${selectedVariant?.id || 'default'}-${(displayImages[0] as { id?: string })?.id || 0}`}
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
                      {/* 会员产品特殊按钮处理 */}
                      {isMembershipProduct ? (
                        !isLoggedIn ? (
                          // 未登录：显示绿色 "Need login to buy" 按钮
                          <Button
                            onClick={() => {
                              onClose()
                              router.push("/account")
                            }}
                            variant="primary"
                            className="w-full h-10 text-white border-none !border-2 !shadow-none bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 !border-green-600 hover:!border-green-700 dark:!border-green-600 dark:hover:!border-green-700"
                            style={{ borderColor: 'rgb(22 163 74)', borderWidth: '2px', borderStyle: 'solid' }}
                          >
                            Need login to buy
                          </Button>
                        ) : isVip ? (
                          // VIP 用户：显示禁用按钮
                          <Button
                            disabled
                            variant="primary"
                            className="w-full h-10 text-white border-none !border-2 !shadow-none bg-ui-bg-disabled hover:bg-ui-bg-disabled dark:bg-ui-bg-disabled dark:hover:bg-ui-bg-disabled !border-ui-border-base cursor-not-allowed"
                            style={{ borderColor: 'rgb(229 231 235)', borderWidth: '2px', borderStyle: 'solid' }}
                          >
                            You are already a VIP
                          </Button>
                        ) : (
                          // 普通用户：正常添加到购物车或 Notify Me 按钮
                          (!inStock && selectedVariant && isValidVariant) ? (
                            // 缺货时显示 Notify Me 按钮
                            <Button
                              onClick={handleNotifyMe}
                              disabled={isTogglingNotify || isNotifyLoading}
                              variant="primary"
                              className="w-full h-10 text-black dark:text-white border-none !border-2 !shadow-none bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 !border-blue-200 dark:!border-blue-800"
                              style={{ borderColor: 'rgb(191 219 254)', borderWidth: '2px', borderStyle: 'solid' }}
                              isLoading={isTogglingNotify}
                            >
                              <span className="flex items-center gap-1 sm:gap-2">
                                <span className="hidden sm:inline">Out of Stock</span>
                                <span className="inline sm:hidden">No Stock</span>
                                <span className="text-gray-400 dark:text-gray-500">|</span>
                                {isSubscribed ? <BellOff size={16} /> : <Bell size={16} />}
                                {isSubscribed ? "Notified" : "Notify Me"}
                              </span>
                            </Button>
                          ) : (
                            <Button
                              onClick={handleAddToCart}
                              disabled={
                                !inStock ||
                                !selectedVariant ||
                                isAdding ||
                                !isValidVariant
                              }
                              variant="primary"
                              className={`w-full h-10 text-white border-none !border-2 !shadow-none ${
                                !isValidVariant || !selectedVariant
                                  ? "bg-ui-bg-disabled hover:bg-ui-bg-disabled dark:bg-ui-bg-disabled dark:hover:bg-ui-bg-disabled !border-ui-border-base cursor-not-allowed"
                                  : "bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 !border-orange-600 hover:!border-orange-700 dark:!border-orange-600 dark:hover:!border-orange-700"
                              }`}
                              style={
                                !isValidVariant || !selectedVariant
                                  ? { borderColor: 'rgb(229 231 235)', borderWidth: '2px', borderStyle: 'solid' }
                                  : { borderColor: 'rgb(234 88 12)', borderWidth: '2px', borderStyle: 'solid' }
                              }
                              isLoading={isAdding}
                            >
                              {!selectedVariant || !isValidVariant
                                ? "Select variant"
                                : "Add to Cart"}
                            </Button>
                          )
                        )
                      ) : (
                        // 非会员产品：正常按钮或 Notify Me 按钮
                        (!inStock && selectedVariant && isValidVariant) ? (
                          // 缺货时显示 Notify Me 按钮
                          <Button
                            onClick={handleNotifyMe}
                            disabled={isTogglingNotify || isNotifyLoading}
                            variant="primary"
                            className="w-full h-10 text-black dark:text-white border-none !border-2 !shadow-none bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 !border-blue-200 dark:!border-blue-800"
                            style={{ borderColor: 'rgb(191 219 254)', borderWidth: '2px', borderStyle: 'solid' }}
                            isLoading={isTogglingNotify}
                          >
                            <span className="flex items-center gap-1 sm:gap-2">
                              <span className="hidden sm:inline">Out of Stock</span>
                              <span className="inline sm:hidden">No Stock</span>
                              <span className="text-gray-400 dark:text-gray-500">|</span>
                              {isSubscribed ? <BellOff size={16} /> : <Bell size={16} />}
                              {isSubscribed ? "Notified" : "Notify Me"}
                            </span>
                          </Button>
                        ) : (
                          <Button
                            onClick={handleAddToCart}
                            disabled={
                              !inStock ||
                              !selectedVariant ||
                              isAdding ||
                              !isValidVariant
                            }
                            variant="primary"
                            className={`w-full h-10 text-white border-none !border-2 !shadow-none ${
                              !isValidVariant || !selectedVariant
                                ? "bg-ui-bg-disabled hover:bg-ui-bg-disabled dark:bg-ui-bg-disabled dark:hover:bg-ui-bg-disabled !border-ui-border-base cursor-not-allowed"
                                : "bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 !border-orange-600 hover:!border-orange-700 dark:!border-orange-600 dark:hover:!border-orange-700"
                            }`}
                            style={
                              !isValidVariant || !selectedVariant
                                ? { borderColor: 'rgb(229 231 235)', borderWidth: '2px', borderStyle: 'solid' }
                                : { borderColor: 'rgb(234 88 12)', borderWidth: '2px', borderStyle: 'solid' }
                            }
                            isLoading={isAdding}
                          >
                            {!selectedVariant || !isValidVariant
                              ? "Select variant"
                              : "Add to Cart"}
                          </Button>
                        )
                      )}
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

