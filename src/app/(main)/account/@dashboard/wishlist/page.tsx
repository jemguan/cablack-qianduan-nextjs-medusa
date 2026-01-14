import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCurrentRegion } from "@lib/data/regions"
import { getPageTitle } from "@lib/data/page-title-config"
import WishlistOverview from "@modules/wishlist/templates/wishlist-overview"

export async function generateMetadata(): Promise<Metadata> {
  const title = await getPageTitle("account_wishlist", { title: "Wishlist" })
  return {
    title,
    description: "View and manage your wishlist items.",
  }
}

export default async function WishlistPage() {
  const region = await getCurrentRegion()

  if (!region) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="wishlist-page-wrapper">
      <div className="mb-4 small:mb-8 flex flex-col gap-y-3 small:gap-y-4">
        <h1 className="text-2xl-semi">My Wishlist</h1>
        <p className="text-base-regular text-muted-foreground">
          View your saved items. Click the heart icon to remove items from your wishlist.
        </p>
      </div>
      <div>
        <WishlistOverview region={region} />
      </div>
    </div>
  )
}

