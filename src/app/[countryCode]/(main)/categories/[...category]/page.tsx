import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"
import { StoreRegion, HttpTypes } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import Breadcrumb from "@modules/common/components/breadcrumb"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
}

export async function generateStaticParams() {
  const product_categories = await listCategories()

  if (!product_categories) {
    return []
  }

  const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
    regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
  )

  const categoryHandles = product_categories.map(
    (category: any) => category.handle
  )

  const staticParams = countryCodes
    ?.map((countryCode: string | undefined) =>
      categoryHandles.map((handle: any) => ({
        countryCode,
        category: [handle],
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  try {
    const productCategory = await getCategoryByHandle(params.category)

    const title = productCategory.name + " | Medusa Store"

    const description = productCategory.description ?? `${title} category.`

    return {
      title: `${title} | Medusa Store`,
      description,
      alternates: {
        canonical: `${params.category.join("/")}`,
      },
    }
  } catch (error) {
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams

  const productCategory = await getCategoryByHandle(params.category)

  if (!productCategory) {
    notFound()
  }

  // Build breadcrumb items with parent categories
  const breadcrumbItems = [
    { label: "Home", href: "/" },
  ]

  // Collect all parent categories in order (from root to direct parent)
  const parents: HttpTypes.StoreProductCategory[] = []
  const getParents = (category: HttpTypes.StoreProductCategory) => {
    if (category.parent_category) {
      getParents(category.parent_category)
      parents.push(category.parent_category)
    }
  }
  getParents(productCategory)

  // Build category path helper function
  const buildCategoryPath = (category: HttpTypes.StoreProductCategory): string[] => {
    const path: string[] = []
    let current: HttpTypes.StoreProductCategory | null = category
    
    while (current) {
      if (current.handle) {
        path.unshift(current.handle)
      }
      current = current.parent_category || null
    }
    
    return path
  }

  // Add parent categories to breadcrumb (in correct order)
  parents.forEach((parent) => {
    if (parent.handle) {
      const categoryPath = buildCategoryPath(parent)
      breadcrumbItems.push({
        label: parent.name,
        href: `/categories/${categoryPath.join("/")}`,
      })
    }
  })

  // Add current category
  breadcrumbItems.push({ label: productCategory.name })

  return (
    <>
      {/* Breadcrumb container below header */}
      <div className="border-b border-ui-border-base bg-background">
        <div className="content-container py-2">
          <Breadcrumb items={breadcrumbItems} countryCode={params.countryCode} />
        </div>
      </div>

      {/* Category content */}
      <CategoryTemplate
        category={productCategory}
        sortBy={sortBy}
        page={page}
        countryCode={params.countryCode}
      />
    </>
  )
}
