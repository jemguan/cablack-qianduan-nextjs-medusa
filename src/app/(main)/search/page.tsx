import { Metadata } from "next"
import { notFound } from "next/navigation"
import { searchProducts } from "@lib/data/search"
import { getCurrentRegion, getCountryCode } from "@lib/data/regions"
import { getPageTitle } from "@lib/data/page-title-config"
import SearchResults from "@modules/search/templates/search-results"

// 强制动态渲染，搜索页面不应该被缓存
export const dynamic = "force-dynamic"

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const searchParams = await props.searchParams
  const searchTerm = searchParams.q || ""

  const title = await getPageTitle("search", {
    term: searchTerm || "Search",
    title: searchTerm ? `Search: ${searchTerm}` : "Search",
  })

  return {
    title,
    description: searchTerm
      ? `Search results for "${searchTerm}"`
      : "Search products",
  }
}

export default async function SearchPage(props: Props) {
  const searchParams = await props.searchParams
  const { q: searchTerm, page } = searchParams
  const countryCode = await getCountryCode()

  const region = await getCurrentRegion()

  if (!region) {
    notFound()
  }

  // If no search term, show empty results
  if (!searchTerm || searchTerm.trim() === "") {
    return (
      <div className="content-container py-6">
        <div className="w-full">
          <div className="mb-8">
            <h1 className="text-2xl-semi mb-2">Search Results</h1>
            <p className="text-small-regular text-ui-fg-subtle">
              Please enter a search term
            </p>
          </div>
          <div className="py-16 text-center">
            <p className="text-lg text-ui-fg-subtle mb-2">Please enter a search term</p>
            <p className="text-small-regular text-ui-fg-muted">
              Enter keywords in the search box above to search
            </p>
          </div>
        </div>
      </div>
    )
  }

  const pageNumber = page ? parseInt(page) : 1

  const { response } = await searchProducts({
    searchTerm: searchTerm.trim(),
    pageParam: pageNumber,
    countryCode,
    limit: 12,
  })

  return (
    <div className="content-container py-6">
      <SearchResults
        products={response.products}
        count={response.count}
        searchTerm={searchTerm.trim()}
        page={pageNumber}
        region={region}
      />
    </div>
  )
}
