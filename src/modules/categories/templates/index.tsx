import { notFound } from "next/navigation"
import { Suspense } from "react"

import InteractiveLink from "@modules/common/components/interactive-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

export default function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!category || !countryCode) notFound()

  // 构建分类的完整路径
  const buildCategoryPath = (cat: HttpTypes.StoreProductCategory): string => {
    const path: string[] = []
    let current: HttpTypes.StoreProductCategory | null = cat
    while (current) {
      if (current.handle) {
        path.unshift(current.handle)
      }
      current = current.parent_category || null
    }
    return path.join("/")
  }

  const parents = [] as HttpTypes.StoreProductCategory[]

  const getParents = (category: HttpTypes.StoreProductCategory) => {
    if (category.parent_category) {
      parents.push(category.parent_category)
      getParents(category.parent_category)
    }
  }

  getParents(category)

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      <RefinementList sortBy={sort} data-testid="sort-by-container" />
      <div className="w-full">
        <div className="flex flex-row mb-8 text-2xl-semi gap-4">
          {parents &&
            parents.map((parent) => {
              const hasHandle = parent.handle && parent.handle.trim() !== ""
              return (
                <span key={parent.id} className="text-ui-fg-subtle">
                  {hasHandle ? (
                    <LocalizedClientLink
                      className="mr-4 hover:text-black"
                      href={`/categories/${buildCategoryPath(parent)}`}
                      data-testid="sort-by-link"
                    >
                      {parent.name}
                    </LocalizedClientLink>
                  ) : (
                    <span className="mr-4">{parent.name}</span>
                  )}
                  /
                </span>
              )
            })}
          <h1 data-testid="category-page-title">{category.name}</h1>
        </div>
        {category.description && (
          <div className="mb-8 text-base-regular">
            <p>{category.description}</p>
          </div>
        )}
        {category.category_children && (
          <div className="mb-8 text-base-large">
            <ul className="grid grid-cols-1 gap-2">
              {category.category_children?.map((c) => {
                // 子分类路径 = 当前分类路径 + 子分类 handle
                const currentPath = buildCategoryPath(category)
                const childPath = c.handle ? `${currentPath}/${c.handle}` : ""
                const hasPath = childPath && childPath.trim() !== ""
                return (
                  <li key={c.id}>
                    <InteractiveLink href={hasPath ? `/categories/${childPath}` : undefined}>
                      {c.name}
                    </InteractiveLink>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
        <Suspense
          fallback={
            <SkeletonProductGrid
              numberOfProducts={category.products?.length ?? 8}
            />
          }
        >
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            categoryId={category.id}
            countryCode={countryCode}
          />
        </Suspense>
      </div>
    </div>
  )
}
