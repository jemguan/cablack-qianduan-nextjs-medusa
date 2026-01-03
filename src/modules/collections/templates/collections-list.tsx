import { HttpTypes } from "@medusajs/types"
import Link from "next/link"
import { getImageUrl } from "@lib/util/image"

export default function CollectionsListTemplate({
  collections,
  countryCode, // No longer used, kept for backward compatibility
}: {
  collections: HttpTypes.StoreCollection[]
  countryCode?: string
}) {
  if (!collections || collections.length === 0) {
    return (
      <div className="content-container py-12">
        <div className="mb-8 text-2xl-semi">
          <h1>All Collections</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-ui-fg-subtle">No collections available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="content-container py-12">
      <div className="mb-8">
        <h1 className="text-2xl-semi mb-2">All Collections</h1>
        <p className="text-ui-fg-subtle">
          {collections.length} collection{collections.length !== 1 ? "s" : ""}
        </p>
      </div>

      <ul className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
        {collections.map((collection) => {
          const collectionLink = `/collections/${collection.handle}`
          const thumbnailUrl = getImageUrl(collection.thumbnail)

          return (
            <li key={collection.id}>
              <Link
                href={collectionLink}
                className="block group"
              >
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-ui-bg-subtle mb-3">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={collection.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ui-fg-subtle">
                      <span>No Image</span>
                    </div>
                  )}
                </div>
                <h3 className="text-base font-semibold text-ui-fg-base group-hover:text-ui-fg-interactive transition-colors">
                  {collection.title}
                </h3>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
