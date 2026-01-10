"use client"

import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import SortProducts, { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

const PRODUCT_LIMIT = 12

interface SearchResultsProps {
  products: HttpTypes.StoreProduct[]
  count: number
  searchTerm: string
  page: number
  region: HttpTypes.StoreRegion
  sortBy: SortOptions
}

const SearchResults = ({
  products,
  count,
  searchTerm,
  page,
  region,
  sortBy,
}: SearchResultsProps) => {
  const totalPages = Math.ceil(count / PRODUCT_LIMIT)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setQueryParams = useCallback(
    (name: string, value: SortOptions) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      // 切换排序时重置到第一页
      params.delete("page")
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col small:flex-row small:items-end small:justify-between gap-4">
        <div>
          <h1 className="text-2xl-semi mb-2" data-testid="search-results-title">
            Search Results
          </h1>
          {searchTerm && (
            <p className="text-small-regular text-ui-fg-subtle">
              Search term: <span className="font-semibold text-foreground">"{searchTerm}"</span>
            </p>
          )}
          <p className="text-small-regular text-ui-fg-subtle mt-1">
            Found {count} {count === 1 ? 'product' : 'products'}
          </p>
        </div>
        {count > 0 && (
          <div className="flex-shrink-0">
            <SortProducts
              sortBy={sortBy}
              setQueryParams={setQueryParams}
              data-testid="search-sort"
            />
          </div>
        )}
      </div>

      {count === 0 ? (
        <div className="py-16 text-center" data-testid="no-results">
          <div className="mb-6">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <p className="text-lg text-ui-fg-subtle mb-2">No products found</p>
          <p className="text-small-regular text-ui-fg-muted mb-4">
            Search term: <span className="font-semibold text-foreground">"{searchTerm}"</span>
          </p>
          <div className="max-w-md mx-auto">
            <p className="text-small-regular text-ui-fg-muted mb-3">
              Try:
            </p>
            <ul className="text-small-regular text-ui-fg-muted space-y-2 text-left inline-block">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Check spelling</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Use more general keywords</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Reduce the number of search terms</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Use synonyms or related terms</span>
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <>
          <ul
            className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
            data-testid="search-results-list"
          >
            {products.map((product) => (
              <li key={product.id}>
                <ProductPreview product={product} region={region} />
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <Pagination
                data-testid="search-pagination"
                page={page}
                totalPages={totalPages}
                searchTerm={searchTerm}
              />
          )}
        </>
      )}
    </div>
  )
}

export default SearchResults

