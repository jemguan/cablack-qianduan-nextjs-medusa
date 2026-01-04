import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCurrentRegion } from "@lib/data/regions"
import { getWishlistByToken } from "@lib/data/wishlists"
import { listProducts } from "@lib/data/products"
import { Text } from "@medusajs/ui"
import ProductPreview from "@modules/products/components/product-preview"
import Heart from "@modules/common/icons/heart"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface SharedWishlistPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}

export const metadata: Metadata = {
  title: "Shared Wishlist",
  description: "View a shared wishlist.",
}

export default async function SharedWishlistPage({
  params,
  searchParams,
}: SharedWishlistPageProps) {
  const { id } = await params
  const { token } = await searchParams

  if (!token) {
    notFound()
  }

  const region = await getCurrentRegion()
  if (!region) {
    notFound()
  }

  const wishlist = await getWishlistByToken(id, token)
  if (!wishlist) {
    notFound()
  }

  // 加载产品信息
  let products: any[] = []
  if (wishlist.items && wishlist.items.length > 0) {
    const productIds = wishlist.items.map((item) => item.product_id)
    const { response } = await listProducts({
      regionId: region.id,
      queryParams: {
        id: productIds,
        limit: productIds.length,
      },
    })
    products = response.products || []
  }

  return (
    <div className="content-container py-12">
      <div className="mb-8 flex flex-col gap-y-4">
        <div className="flex items-center gap-2">
          <Heart size="24" className="text-red-500" filled />
          <h1 className="text-2xl-semi">{wishlist.name}</h1>
        </div>
        <Text className="text-muted-foreground">
          This wishlist has been shared with you. Browse the items and add them to your cart!
        </Text>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Heart size="48" className="text-muted-foreground" />
          <Text className="text-xl font-semibold text-foreground">
            This wishlist is empty
          </Text>
          <Text className="text-muted-foreground text-center max-w-md">
            The owner hasn&apos;t added any items to this wishlist yet.
          </Text>
          <LocalizedClientLink
            href="/store"
            className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Browse Products
          </LocalizedClientLink>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* 产品数量 */}
          <Text className="text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? "item" : "items"} in this wishlist
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
      )}
    </div>
  )
}

