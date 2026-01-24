"use client"

import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useRestockNotify } from "@lib/context/restock-notify-context"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Bell, BellOff } from "lucide-react"

interface NotifyMeButtonProps {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant | null
  customer?: HttpTypes.StoreCustomer | null
  size?: "small" | "medium" | "large"
  className?: string
  showLabel?: boolean
}

export default function NotifyMeButton({
  product,
  variant,
  customer,
  size = "medium",
  className = "",
  showLabel = true,
}: NotifyMeButtonProps) {
  const router = useRouter()
  const { isSubscribedToVariant, toggleRestockSubscription, isLoading } = useRestockNotify()
  const [isTogglingSubscription, setIsTogglingSubscription] = useState(false)

  if (!variant) {
    return null
  }

  const isSubscribed = isSubscribedToVariant(variant.id)

  const handleToggleSubscription = async () => {
    if (!customer) {
      // 未登录，跳转到登录页
      router.push("/account")
      return
    }

    setIsTogglingSubscription(true)
    try {
      await toggleRestockSubscription(
        product,
        variant,
        customer.email || ""
      )
    } catch (error) {
      console.error("Failed to toggle notification:", error)
    } finally {
      setIsTogglingSubscription(false)
    }
  }

  const sizeStyles = {
    small: "text-xs px-2 py-1 h-7",
    medium: "text-sm px-3 py-2 h-9",
    large: "text-base px-4 py-3 h-11",
  }

  const buttonLabel = isSubscribed ? "Notified" : "Notify Me"

  // 已订阅时显示绿色，未订阅时显示蓝色
  const subscriptionClassName = isSubscribed
    ? "bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-black dark:text-white"
    : "bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-black dark:text-white"

  return (
    <Button
      onClick={handleToggleSubscription}
      disabled={isLoading || isTogglingSubscription}
      variant="secondary"
      className={`flex items-center gap-2 border-none !shadow-none transition-all ${sizeStyles[size]} ${className} ${subscriptionClassName}`}
      isLoading={isTogglingSubscription || isLoading}
      data-testid="notify-me-button"
    >
      {isSubscribed ? (
        <BellOff size={16} className="flex-shrink-0" />
      ) : (
        <Bell size={16} className="flex-shrink-0" />
      )}
      {showLabel && buttonLabel}
    </Button>
  )
}
