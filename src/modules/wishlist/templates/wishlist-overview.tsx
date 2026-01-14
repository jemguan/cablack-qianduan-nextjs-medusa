"use client"

import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import ProductPreview from "@modules/products/components/product-preview"
import { useWishlist } from "@lib/context/wishlist-context"
import { useState, useEffect } from "react"
import { listProducts } from "@lib/data/products"
import { FaHeart } from "react-icons/fa"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { EmblaCarousel } from "@lib/ui/embla-carousel"

interface WishlistOverviewProps {
  region: HttpTypes.StoreRegion
}

const WishlistOverview = ({ region }: WishlistOverviewProps) => {
  const { wishlistItems, isLoading, itemCount } = useWishlist()
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)

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

  if (isLoading || isLoadingProducts) {
    return (
      <div className="flex items-center justify-center py-12">
        <Text className="text-muted-foreground">Loading wishlist...</Text>
      </div>
    )
  }

  if (itemCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
          <FaHeart className="w-10 h-10 text-muted-foreground" />
        </div>
        <Text className="text-xl font-semibold text-foreground mb-2">
          Your wishlist is empty
        </Text>
        <Text className="text-muted-foreground text-center max-w-md mb-6">
          Browse our products and click the heart icon to add items to your wishlist.
        </Text>
        <LocalizedClientLink
          href="/products"
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-200 cursor-pointer font-medium"
        >
          Start Shopping
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 small:gap-6">
      {/* 产品数量 */}
      <Text className="text-sm text-muted-foreground font-medium">
        {itemCount} {itemCount === 1 ? "item" : "items"} in your wishlist
      </Text>

      {/* 产品展示：移动端使用轮播，桌面端使用网格 */}
      <div className="small:hidden">
        {/* 移动端：轮播 */}
        <EmblaCarousel
          mobileSlidesPerView={1.5}
          desktopSlidesPerView={4}
          spacing={16}
          showPagination={true}
          showNavigation={false}
          loop={false}
          autoplay={false}
          draggable={true}
          align="start"
        >
          {products.map((product) => (
            <ProductPreview
              key={product.id}
              product={product}
              region={region}
            />
          ))}
        </EmblaCarousel>
      </div>

      {/* 桌面端：网格布局 */}
      <div className="hidden small:grid grid-cols-3 medium:grid-cols-4 gap-6">
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

