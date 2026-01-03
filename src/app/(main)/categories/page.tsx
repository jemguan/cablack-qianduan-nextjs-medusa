import { Metadata } from "next"

import { listCategories } from "@lib/data/categories"
import { getCountryCode } from "@lib/data/regions"
import CategoriesListTemplate from "@modules/categories/templates/categories-list"
import Breadcrumb from "@modules/common/components/breadcrumb"

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse all product categories.",
}

export default async function CategoriesPage() {
  const countryCode = await getCountryCode()

  const categories = await listCategories({
    limit: 100,
  })

  // Filter to show only top-level categories (no parent)
  const topLevelCategories = categories.filter(
    (category) => !category.parent_category
  )

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Categories" },
  ]

  return (
    <>
      {/* Breadcrumb container below header */}
      <div className="border-b border-ui-border-base bg-background">
        <div className="content-container py-2">
          <Breadcrumb items={breadcrumbItems} countryCode={countryCode} />
        </div>
      </div>

      {/* Categories list content */}
      <CategoriesListTemplate
        categories={topLevelCategories}
        countryCode={countryCode}
      />
    </>
  )
}
