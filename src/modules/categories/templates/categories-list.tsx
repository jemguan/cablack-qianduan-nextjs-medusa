import { HttpTypes } from "@medusajs/types"
import Link from "next/link"

export default function CategoriesListTemplate({
  categories,
  countryCode, // No longer used, kept for backward compatibility
}: {
  categories: HttpTypes.StoreProductCategory[]
  countryCode?: string
}) {
  if (!categories || categories.length === 0) {
    return (
      <div className="content-container py-12">
        <div className="mb-8 text-2xl-semi">
          <h1>All Categories</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-ui-fg-subtle">No categories available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="content-container py-12">
      <div className="mb-8">
        <h1 className="text-2xl-semi mb-2">All Categories</h1>
        <p className="text-ui-fg-subtle">
          {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
        </p>
      </div>

      <ul className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
        {categories.map((category) => {
          const categoryLink = `/categories/${category.handle}`

          return (
            <li key={category.id}>
              <Link
                href={categoryLink}
                className="block group"
              >
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-ui-bg-subtle mb-3 flex items-center justify-center border border-ui-border-base group-hover:border-ui-border-interactive transition-colors">
                  <span className="text-ui-fg-subtle group-hover:text-ui-fg-interactive transition-colors text-lg font-medium">
                    {category.name}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-ui-fg-base group-hover:text-ui-fg-interactive transition-colors">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-sm text-ui-fg-subtle mt-1 line-clamp-2">
                    {category.description}
                  </p>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
