import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { Brand } from "@lib/data/brands"

export default function BrandTemplate({
  sortBy,
  brand,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  brand: Brand & { products?: any[] }
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const productIds = brand.products?.map((p: any) => p?.id || p).filter(Boolean) || []

  return (
    <div className="flex flex-col small:flex-row small:items-start py-6 content-container">
      <RefinementList sortBy={sort} />
      <div className="w-full">
        <div className="mb-8 text-2xl-semi">
          <h1>{brand.name}</h1>
          {brand.description && (
            <p className="text-ui-fg-subtle mt-2">{brand.description}</p>
          )}
        </div>
        {productIds.length > 0 ? (
          <Suspense
            fallback={
              <SkeletonProductGrid
                numberOfProducts={productIds.length || 12}
              />
            }
          >
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              productsIds={productIds}
              countryCode={countryCode}
            />
          </Suspense>
        ) : (
          <div className="text-center py-12">
            <p className="text-ui-fg-subtle">该品牌暂无产品</p>
          </div>
        )}
      </div>
    </div>
  )
}

