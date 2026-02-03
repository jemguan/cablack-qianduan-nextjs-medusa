"use client"

import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { addToCart } from "@lib/data/cart"
import { memo, useState, useMemo } from "react"
import Image from "next/image"
import dynamic from "next/dynamic"
import { getImageUrl } from "@lib/util/image"
import WishlistButton from "@modules/wishlist/components/wishlist-button"
import { useProductImages } from "../product-preview/hooks/useProductImages"
import { ShoppingCart, Star, Check, Loader2 } from "lucide-react"
import { useParams } from "next/navigation"
import type { Brand } from "@lib/data/brands"
import { useProductCardConfig } from "@lib/context/product-card-config-context"

const QuickViewModal = dynamic(() => import("../product-preview/quick-view-modal"), {
  ssr: false,
})

// 评价统计类型
interface PreFetchedReviewStats {
  average_rating: number
  total: number
}

// 评价徽章组件
function RatingBadge({ stats }: { stats?: PreFetchedReviewStats | null }) {
  if (!stats || stats.total === 0) return null
  return (
    <div className="flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded-md">
      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
      <span className="text-xs font-semibold">{stats.average_rating.toFixed(1)}</span>
      <span className="text-[11px] text-white/70">({stats.total})</span>
    </div>
  )
}

// 添加购物车按钮
function AddToCartButton({
  product,
  onOpenQuickView,
  buttonBackgroundColor = "#FFD500",
}: {
  product: HttpTypes.StoreProduct
  onOpenQuickView: () => void
  buttonBackgroundColor?: string
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const params = useParams()
  const countryCode = params?.countryCode as string

  const defaultVariant = product.variants?.[0]
  const hasMultipleVariants = (product.variants?.length || 0) > 1

  const inStock = useMemo(() => {
    if (!defaultVariant) return false
    if (defaultVariant.manage_inventory === false) return true
    if (defaultVariant.allow_backorder === true) return true
    return (defaultVariant.inventory_quantity || 0) > 0
  }, [defaultVariant])

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (hasMultipleVariants) {
      onOpenQuickView()
      return
    }

    if (!defaultVariant?.id || !inStock) return

    setIsAdding(true)
    try {
      await addToCart({ variantId: defaultVariant.id, quantity: 1, countryCode })
      setIsSuccess(true)
      setTimeout(() => setIsSuccess(false), 2000)
    } catch (e) {
      console.error("Failed to add to cart:", e)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isAdding || !inStock}
      className="flex-shrink-0 flex items-center justify-center w-12 h-10 rounded-md transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 shadow-lg"
      style={{
        backgroundColor: isSuccess ? "#22c55e" : buttonBackgroundColor,
      }}
    >
      {isAdding ? (
        <Loader2 size={18} className="animate-spin text-gray-900 dark:text-gray-100" />
      ) : isSuccess ? (
        <Check size={18} className="text-white" />
      ) : (
        <ShoppingCart size={18} className="text-gray-900 dark:text-gray-100" />
      )}
    </button>
  )
}

type ProductCard3Props = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  brand?: Brand | null
  reviewStats?: PreFetchedReviewStats | null
  priority?: boolean
  customer?: HttpTypes.StoreCustomer | null
}

const ProductCard3 = memo(function ProductCard3({
  product,
  region,
  brand,
  reviewStats,
  priority = false,
  customer,
}: ProductCard3Props) {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
  const cardConfig = useProductCardConfig()
  const card3Settings = cardConfig.card3

  const displayImages = useProductImages(product, null)
  const cheapestPrice = getProductPrice({ product }).cheapestPrice

  const isOnSale = cheapestPrice?.price_type === "sale"
  const discountPercentage = cheapestPrice?.percentage_diff

  // 从配置获取设置
  const showSubtitle = card3Settings.showSubtitle !== false
  const buttonBackgroundColor = card3Settings.buttonBackgroundColor || "#FFD500"
  const brandBadgeColor = card3Settings.brandBadgeColor || "#019038"

  return (
    <>
      <div
        className="group relative flex flex-col w-full rounded-2xl bg-white dark:bg-gray-800 overflow-hidden shadow-md dark:shadow-gray-900/30"
      >
        {/* 图片区域 - 使用 aspect-square 保持正方形比例 */}
        <div className="relative aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
          <LocalizedClientLink
            href={`/products/${product.handle}`}
            className="absolute inset-0 z-10"
            aria-label={`View ${product.title}`}
          />

          {displayImages.length > 0 && displayImages[0]?.url && (
            <Image
              src={getImageUrl(displayImages[0].url || '')}
              alt={product.title || "Product"}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              loading={priority ? "eager" : "lazy"}
              priority={priority}
              quality={85}
            />
          )}

          {/* 折扣徽章 - 左上角 */}
          {isOnSale && discountPercentage && (
            <div
              className="absolute top-3 left-0 z-20 flex items-center px-3 py-1.5 rounded-r-full"
              style={{ backgroundColor: "#FDEAEA" }}
            >
              <span
                className="text-[13px] font-black"
                style={{
                  color: "#F21111",
                  fontFamily: "Impact, sans-serif",
                  textShadow: "0.7px 1.7px 5.7px rgba(0,0,0,0.1)"
                }}
              >
                {discountPercentage}% OFF
              </span>
            </div>
          )}

          {/* Wishlist 按钮 - 右上角，悬停显示 */}
          <div className="absolute top-4 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <WishlistButton product={product} size="sm" iconOnly />
          </div>

          {/* 评价徽章 - 左下角，悬停显示 */}
          <div className="absolute bottom-3 left-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <RatingBadge stats={reviewStats} />
          </div>
        </div>

        {/* 内容区域 - 使用 flexbox 布局 */}
        <div className="flex flex-col gap-1.5 p-3">
          {/* 标题 */}
          <LocalizedClientLink href={`/products/${product.handle}`}>
            <h3 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-[1.4] overflow-hidden hover:text-gray-700 dark:hover:text-gray-300 transition-colors" style={{ maxHeight: 'calc(13px * 1.4 * 2)' }}>
              {product.title}
            </h3>
          </LocalizedClientLink>

          {/* 副标题 */}
          {showSubtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-[1.5] overflow-hidden" style={{ maxHeight: 'calc(12px * 1.5 * 2)' }}>
              {product.subtitle || product.description?.slice(0, 100) || "\u00A0"}
            </p>
          )}

          {/* 品牌徽章 */}
          {brand && (
            <LocalizedClientLink
              href={`/brands/${brand.slug || brand.id}`}
              className="self-start"
            >
              <span
                className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border transition-colors hover:opacity-80"
                style={{
                  color: brandBadgeColor,
                  borderColor: brandBadgeColor,
                  borderWidth: "1.5px"
                }}
              >
                {brand.name}
              </span>
            </LocalizedClientLink>
          )}

          {/* 价格行 */}
          <div className="flex items-center justify-between gap-2 mt-1">
            {/* 价格 */}
            <div className="flex flex-col min-w-0">
              {cheapestPrice && (
                <>
                  <span
                    className="text-xl font-extrabold"
                    style={{ color: "#E53935" }}
                  >
                    {cheapestPrice.calculated_price}
                  </span>
                  {isOnSale && cheapestPrice.original_price_number > cheapestPrice.calculated_price_number && (
                    <span className="text-sm text-gray-400 dark:text-gray-500 line-through">
                      {cheapestPrice.original_price}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* 购物车按钮 */}
            <AddToCartButton
              product={product}
              onOpenQuickView={() => setIsQuickViewOpen(true)}
              buttonBackgroundColor={buttonBackgroundColor}
            />
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={product}
        region={region}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        customer={customer}
      />
    </>
  )
})

export default ProductCard3
