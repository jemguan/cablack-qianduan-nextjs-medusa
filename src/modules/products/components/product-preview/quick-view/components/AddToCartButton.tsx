"use client"

import { Button } from "@medusajs/ui"
import { Bell, BellOff } from "lucide-react"
import type { AddToCartButtonProps } from "../types"

/**
 * 添加到购物车按钮组件
 * 处理各种状态：会员产品、缺货、正常添加等
 */
export function AddToCartButton({
  selectedVariant,
  isValidVariant,
  inStock,
  isAdding,
  isMembershipProduct,
  isLoggedIn,
  isVip,
  isSubscribed,
  isTogglingNotify,
  isNotifyLoading,
  onAddToCart,
  onNotifyMe,
  onLoginRequired,
}: AddToCartButtonProps) {
  // 缺货时的 Notify Me 按钮
  const renderNotifyMeButton = () => (
    <Button
      onClick={onNotifyMe}
      disabled={isTogglingNotify || isNotifyLoading}
      variant="primary"
      className="w-full h-10 text-black dark:text-white border-none !border-2 !shadow-none bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 !border-blue-200 dark:!border-blue-800"
      style={{
        borderColor: "rgb(191 219 254)",
        borderWidth: "2px",
        borderStyle: "solid",
      }}
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
  )

  // 正常的添加到购物车按钮
  const renderAddToCartButton = () => (
    <Button
      onClick={onAddToCart}
      disabled={!inStock || !selectedVariant || isAdding || !isValidVariant}
      variant="primary"
      className={`w-full h-10 text-white border-none !border-2 !shadow-none ${
        !isValidVariant || !selectedVariant
          ? "bg-ui-bg-disabled hover:bg-ui-bg-disabled dark:bg-ui-bg-disabled dark:hover:bg-ui-bg-disabled !border-ui-border-base cursor-not-allowed"
          : "bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 !border-orange-600 hover:!border-orange-700 dark:!border-orange-600 dark:hover:!border-orange-700"
      }`}
      style={
        !isValidVariant || !selectedVariant
          ? {
              borderColor: "rgb(229 231 235)",
              borderWidth: "2px",
              borderStyle: "solid",
            }
          : {
              borderColor: "rgb(234 88 12)",
              borderWidth: "2px",
              borderStyle: "solid",
            }
      }
      isLoading={isAdding}
    >
      {!selectedVariant || !isValidVariant ? "Select variant" : "Add to Cart"}
    </Button>
  )

  // 会员产品特殊处理
  if (isMembershipProduct) {
    if (!isLoggedIn) {
      // 未登录：显示绿色 "Need login to buy" 按钮
      return (
        <Button
          onClick={onLoginRequired}
          variant="primary"
          className="w-full h-10 text-white border-none !border-2 !shadow-none bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 !border-green-600 hover:!border-green-700 dark:!border-green-600 dark:hover:!border-green-700"
          style={{
            borderColor: "rgb(22 163 74)",
            borderWidth: "2px",
            borderStyle: "solid",
          }}
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
          className="w-full h-10 text-white border-none !border-2 !shadow-none bg-ui-bg-disabled hover:bg-ui-bg-disabled dark:bg-ui-bg-disabled dark:hover:bg-ui-bg-disabled !border-ui-border-base cursor-not-allowed"
          style={{
            borderColor: "rgb(229 231 235)",
            borderWidth: "2px",
            borderStyle: "solid",
          }}
        >
          You are already a VIP
        </Button>
      )
    }

    // 普通用户：正常添加到购物车或 Notify Me 按钮
    if (!inStock && selectedVariant && isValidVariant) {
      return renderNotifyMeButton()
    }
    return renderAddToCartButton()
  }

  // 非会员产品：正常按钮或 Notify Me 按钮
  if (!inStock && selectedVariant && isValidVariant) {
    return renderNotifyMeButton()
  }
  return renderAddToCartButton()
}
