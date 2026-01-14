"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import { FaHeart, FaRegHeart } from "react-icons/fa"
import { useWishlistOptional } from "@lib/context/wishlist-context"

interface WishlistButtonProps {
  product: HttpTypes.StoreProduct
  /** 按钮尺寸 */
  size?: "sm" | "md" | "lg"
  /** 是否显示为纯图标按钮（无背景） */
  iconOnly?: boolean
  /** 自定义类名 */
  className?: string
  /** 是否显示在卡片上（悬浮样式） */
  overlay?: boolean
}

const sizeMap = {
  sm: "16",
  md: "20",
  lg: "24",
}

const WishlistButton = ({
  product,
  size = "md",
  iconOnly = false,
  className,
  overlay = false,
}: WishlistButtonProps) => {
  const wishlist = useWishlistOptional()
  const [isUpdating, setIsUpdating] = useState(false)

  // 如果没有 WishlistProvider，不渲染按钮
  if (!wishlist) {
    return null
  }

  const { isInWishlist, toggleWishlist, isLoading } = wishlist
  const isInList = isInWishlist(product.id)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isUpdating || isLoading) return

    setIsUpdating(true)
    try {
      await toggleWishlist(product)
    } catch (error) {
      console.error("Failed to update wishlist:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const iconSize = sizeMap[size]

  // 悬浮样式（用于产品卡片）
  if (overlay) {
    return (
      <button
        onClick={handleClick}
        disabled={isUpdating || isLoading}
        className={clx(
          "absolute top-2 right-2 z-20",
          "p-1.5 rounded-full",
          "bg-background/80 backdrop-blur-sm",
          "border border-border/50",
          "shadow-sm",
          "transition-all duration-200",
          "hover:bg-background hover:scale-110",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isInList && "text-red-500",
          !isInList && "text-muted-foreground hover:text-red-500",
          className
        )}
        aria-label={isInList ? "Remove from wishlist" : "Add to wishlist"}
      >
        {isInList ? (
          <FaHeart
            size={parseInt(iconSize)}
            className={clx(
              "transition-transform duration-200",
              isUpdating && "animate-pulse"
            )}
          />
        ) : (
          <FaRegHeart
            size={parseInt(iconSize)}
            className={clx(
              "transition-transform duration-200",
              isUpdating && "animate-pulse"
            )}
          />
        )}
      </button>
    )
  }

  // 纯图标按钮样式
  if (iconOnly) {
    return (
      <button
        onClick={handleClick}
        disabled={isUpdating || isLoading}
        className={clx(
          "p-2 rounded-full",
          "transition-all duration-200",
          "hover:bg-muted",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isInList && "text-red-500",
          !isInList && "text-muted-foreground hover:text-red-500",
          className
        )}
        aria-label={isInList ? "Remove from wishlist" : "Add to wishlist"}
      >
        {isInList ? (
          <FaHeart
            size={parseInt(iconSize)}
            className={clx(
              "transition-transform duration-200",
              isUpdating && "animate-pulse"
            )}
          />
        ) : (
          <FaRegHeart
            size={parseInt(iconSize)}
            className={clx(
              "transition-transform duration-200",
              isUpdating && "animate-pulse"
            )}
          />
        )}
      </button>
    )
  }

  // 默认按钮样式（带边框）
  return (
    <button
      onClick={handleClick}
      disabled={isUpdating || isLoading}
      className={clx(
        "flex items-center justify-center gap-2",
        "px-4 py-2 rounded-md",
        "border transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        isInList
          ? "border-red-500 text-red-500 bg-red-50 dark:bg-red-950/20"
          : "border-border text-muted-foreground hover:border-red-500 hover:text-red-500",
        className
      )}
      aria-label={isInList ? "Remove from wishlist" : "Add to wishlist"}
    >
      {isInList ? (
        <FaHeart
          size={parseInt(iconSize)}
          className={clx(
            "transition-transform duration-200",
            isUpdating && "animate-pulse"
          )}
        />
      ) : (
        <FaRegHeart
          size={parseInt(iconSize)}
          className={clx(
            "transition-transform duration-200",
            isUpdating && "animate-pulse"
          )}
        />
      )}
      <span className="text-sm font-medium">
        {isInList ? "In Wishlist" : "Add to Wishlist"}
      </span>
    </button>
  )
}

export default WishlistButton

