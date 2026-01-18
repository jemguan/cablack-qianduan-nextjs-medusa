"use client"

import { addToCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button, clx } from "@medusajs/ui"
import { FaShoppingBag, FaCheck } from "react-icons/fa"
import { Bell, BellOff } from "lucide-react"
import { useRestockNotify } from "@lib/context/restock-notify-context"
import { useParams, useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { isEqual } from "lodash"
import type { LoyaltyAccount } from "@/types/loyalty"

type QuickAddButtonProps = {
  product: HttpTypes.StoreProduct
  selectedVariant: HttpTypes.StoreProductVariant | null | undefined
  options: Record<string, string | undefined>
  onOpenQuickView?: () => void
  compact?: boolean
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

const QuickAddButton: React.FC<QuickAddButtonProps> = ({
  product,
  selectedVariant,
  options,
  onOpenQuickView,
  compact = false,
  customer,
  loyaltyAccount,
  membershipProductIds,
}) => {
  const [isAdding, setIsAdding] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
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

  // Check if all options are selected
  const allOptionsSelected = useMemo(() => {
    if (!product.options || product.options.length === 0) return true
    return product.options.every(option => options[option.id])
  }, [product.options, options])

  // Check if variant is valid
  const isValidVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return false
    return product.variants.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // Check if variant is in stock
  // According to Medusa docs: variant is in stock if manage_inventory === false OR inventory_quantity > 0
  const inStock = useMemo(() => {
    if (!selectedVariant) {
      // If no variant selected, check if any variant is in stock
      return product.variants?.some((v) => {
        if (v.manage_inventory === false) return true
        if (v.allow_backorder === true) return true
        // Check inventory quantity (if null/undefined, consider out of stock per Medusa docs)
        return (v.inventory_quantity || 0) > 0
      }) ?? false
    }
    
    // If inventory is not managed, always in stock
    if (selectedVariant.manage_inventory === false) {
      return true
    }
    // If backorder is allowed, always in stock
    if (selectedVariant.allow_backorder === true) {
      return true
    }
    // Check inventory quantity (if null/undefined, consider out of stock per Medusa docs)
    return (selectedVariant.inventory_quantity || 0) > 0
  }, [selectedVariant, product.variants])

  // 检查当前变体是否已订阅补货通知
  const isSubscribed = useMemo(() => {
    if (!selectedVariant) return false
    return isSubscribedToVariant(selectedVariant.id)
  }, [selectedVariant, isSubscribedToVariant])

  // 处理补货通知订阅/取消订阅
  const handleNotifyMe = async () => {
    if (!selectedVariant) {
      // 如果没有选中变体，打开 Quick View
      if (onOpenQuickView) {
        onOpenQuickView()
      }
      return
    }

    if (!customer) {
      // 未登录，跳转到登录页
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

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id || !inStock || !isValidVariant) {
      if (onOpenQuickView && product.variants && product.variants.length > 1) {
        onOpenQuickView()
      }
      return
    }

    setIsAdding(true)
    setIsSuccess(false)

    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
      })

      setIsSuccess(true)
      // addToCart 内部已调用 revalidateTag，无需 router.refresh()

      // Reset success state after 2 seconds
      setTimeout(() => {
        setIsSuccess(false)
      }, 2000)
    } catch (error) {
      console.error("Failed to add to cart:", error)
    } finally {
      setIsAdding(false)
    }
  }

  // 会员产品特殊处理
  if (isMembershipProduct) {
    if (!isLoggedIn) {
      // 未登录：显示绿色 "Need login to buy" 按钮
      return (
        <Button
          onClick={() => router.push("/account")}
          variant="primary"
          className={clx(
            "w-full transition-all duration-200 hover:scale-105 active:scale-95 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white border-none !border-2 !border-green-600 hover:!border-green-700 dark:!border-green-600 dark:hover:!border-green-700 !shadow-none",
            compact ? "h-8 text-xs" : "h-10"
          )}
          style={{ borderColor: 'rgb(22 163 74)', borderWidth: '2px', borderStyle: 'solid' }}
        >
          Need login to buy
        </Button>
      )
    }

    if (isVip) {
      // VIP 用户：显示禁用按钮
      return (
        <Button
          disabled
          variant="primary"
          className={clx(
            "w-full transition-all duration-200 bg-ui-bg-disabled hover:bg-ui-bg-disabled dark:bg-ui-bg-disabled dark:hover:bg-ui-bg-disabled text-white border-none !border-2 !border-ui-border-base cursor-not-allowed !shadow-none",
            compact ? "h-8 text-xs" : "h-10"
          )}
          style={{ borderColor: 'rgb(229 231 235)', borderWidth: '2px', borderStyle: 'solid' }}
        >
          You are already a VIP
        </Button>
      )
    }
  }

  // If product has multiple variants and options are not all selected
  if (product.variants && product.variants.length > 1 && !allOptionsSelected) {
    return (
      <Button
        onClick={onOpenQuickView}
        variant="secondary"
        className={clx(
          "w-full transition-all duration-200",
          compact ? "h-8 text-xs" : "h-10"
        )}
        disabled={isAdding}
      >
        Select Options
      </Button>
    )
  }

  // If variant is not valid
  if (!isValidVariant) {
    return (
      <Button
        onClick={onOpenQuickView}
        variant="secondary"
        className={clx(
          "w-full transition-all duration-200",
          compact ? "h-8 text-xs" : "h-10"
        )}
        disabled={isAdding}
      >
        Select Options
      </Button>
    )
  }

  // If variant is not in stock, show Notify Me button
  if (!inStock) {
    return (
      <Button
        onClick={handleNotifyMe}
        variant="secondary"
        className={clx(
          "w-full transition-all duration-200 text-black dark:text-white bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 border-blue-200 dark:border-blue-800",
          compact ? "h-8 text-xs" : "h-10"
        )}
        disabled={isTogglingNotify || isNotifyLoading}
        isLoading={isTogglingNotify}
      >
        <span className="flex items-center gap-1 justify-center">
          <span>No Stock</span>
          <span className="text-gray-400 dark:text-gray-500">|</span>
          {isSubscribed ? <BellOff size={compact ? 12 : 14} /> : <Bell size={compact ? 12 : 14} />}
          {isSubscribed ? "Notified" : "Notify Me"}
        </span>
      </Button>
    )
  }

  return (
    <Button
      onClick={handleAddToCart}
      variant="primary"
      className={clx(
        "w-full transition-all duration-200 hover:scale-105 active:scale-95",
        compact ? "h-8 text-xs" : "h-10",
        isSuccess 
          ? "bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white border-none !border-2 !border-green-600 hover:!border-green-700 dark:!border-green-600 dark:hover:!border-green-700 disabled:!border-ui-border-base !shadow-none"
          : "bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white border-none !border-2 !border-orange-600 hover:!border-orange-700 dark:!border-orange-600 dark:hover:!border-orange-700 disabled:!border-ui-border-base !shadow-none"
      )}
      style={{ borderColor: isSuccess ? 'rgb(22 163 74)' : 'rgb(234 88 12)', borderWidth: '2px', borderStyle: 'solid' }}
      disabled={isAdding || !selectedVariant}
      isLoading={isAdding}
    >
      {isSuccess ? (
        <span className="flex items-center gap-2">
          <FaCheck size={16} />
          Added
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <FaShoppingBag size={16} />
          Add to Cart
        </span>
      )}
    </Button>
  )
}

export default QuickAddButton

