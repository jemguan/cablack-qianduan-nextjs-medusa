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

  return (
    <Button
      onClick={handleToggleSubscription}
      disabled={isLoading || isTogglingSubscription}
      variant={isSubscribed ? "secondary" : "secondary"}
      className={`flex items-center gap-2 border-none !shadow-none transition-all ${sizeStyles[size]} ${className} ${
        isSubscribed
          ? "bg-ui-bg-base hover:bg-ui-bg-base-hover"
          : "bg-ui-bg-base hover:bg-ui-bg-base-hover"
      }`}
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
