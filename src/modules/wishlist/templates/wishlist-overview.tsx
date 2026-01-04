"use client"

import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import ProductPreview from "@modules/products/components/product-preview"
import { useWishlist } from "@lib/context/wishlist-context"
import { useState, useEffect } from "react"
import { listProducts } from "@lib/data/products"
import Heart from "@modules/common/icons/heart"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface WishlistOverviewProps {
  region: HttpTypes.StoreRegion
}

const WishlistOverview = ({ region }: WishlistOverviewProps) => {
  const { wishlistItems, isLoading, itemCount, shareToken, wishlistId, isAuthenticated } = useWishlist()
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // 加载产品信息
  useEffect(() => {
    const loadProducts = async () => {
      if (wishlistItems.length === 0) {
        setProducts([])
        setIsLoadingProducts(false)
        return
      }

      setIsLoadingProducts(true)
      try {
        const productIds = wishlistItems.map((item) => item.product_id)
        const { response } = await listProducts({
          regionId: region.id,
          queryParams: {
            id: productIds,
            limit: productIds.length,
          },
        })
        setProducts(response.products || [])
      } catch (error) {
        console.error("Failed to load wishlist products:", error)
        setProducts([])
      } finally {
        setIsLoadingProducts(false)
      }
    }

    loadProducts()
  }, [wishlistItems, region.id])

  // 生成分享链接
  useEffect(() => {
    if (wishlistId && shareToken && typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/wishlist/${wishlistId}?token=${shareToken}`)
    }
  }, [wishlistId, shareToken])

  const handleCopyShareLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy share link:", error)
    }
  }

  if (isLoading || isLoadingProducts) {
    return (
      <div className="flex items-center justify-center py-12">
        <Text className="text-muted-foreground">Loading wishlist...</Text>
      </div>
    )
  }

  if (itemCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Heart size="48" className="text-muted-foreground" />
        <Text className="text-xl font-semibold text-foreground">
          Your wishlist is empty
        </Text>
        <Text className="text-muted-foreground text-center max-w-md">
          Browse our products and click the heart icon to add items to your wishlist.
        </Text>
        <LocalizedClientLink
          href="/store"
          className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Start Shopping
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 分享功能 */}
      {isAuthenticated && shareUrl && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <Text className="text-sm text-muted-foreground">
            Share your wishlist with friends:
          </Text>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="px-3 py-1.5 text-sm bg-background border border-border rounded-md w-64 truncate"
            />
            <button
              onClick={handleCopyShareLink}
              className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* 产品数量 */}
      <Text className="text-sm text-muted-foreground">
        {itemCount} {itemCount === 1 ? "item" : "items"} in your wishlist
      </Text>

      {/* 产品网格 */}
      <div className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-4 gap-y-8">
        {products.map((product) => (
          <ProductPreview
            key={product.id}
            product={product}
            region={region}
          />
        ))}
      </div>
    </div>
  )
}

export default WishlistOverview

