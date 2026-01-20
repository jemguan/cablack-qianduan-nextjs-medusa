import { Metadata } from "next"
import { notFound } from "next/navigation"
import { searchProducts } from "@lib/data/search"
import { getCurrentRegion, getCountryCode } from "@lib/data/regions"
import { getPageTitle } from "@lib/data/page-title-config"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import SearchResults from "@modules/search/templates/search-results"
import { retrieveCustomer } from "@lib/data/customer"
import { getLoyaltyAccount, getLoyaltyConfig } from "@lib/data/loyalty"

// 强制动态渲染，搜索页面不应该被缓存
export const dynamic = "force-dynamic"

type Props = {
  searchParams: Promise<{ q?: string; page?: string; sortBy?: SortOptions }>
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
  const { q: searchTerm, page, sortBy } = searchParams
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
  // 默认按发布日期排序
  const safeSortBy: SortOptions = sortBy || "published_at"

  // 并行获取搜索结果和会员数据
  const [searchResult, customer, loyaltyAccountResponse, loyaltyConfigResponse] = await Promise.all([
    searchProducts({
      searchTerm: searchTerm.trim(),
      pageParam: pageNumber,
      countryCode,
      regionId: region.id,
      limit: 12,
      sortBy: safeSortBy,
    }),
    retrieveCustomer(),
    getLoyaltyAccount(),
    getLoyaltyConfig(),
  ])

  const { response } = searchResult

  // 提取 loyaltyAccount 和 membershipProductIds
  const loyaltyAccount = loyaltyAccountResponse?.account || null
  const membershipProductIds = loyaltyConfigResponse?.config?.membership_product_ids || null

  return (
    <div className="content-container py-6">
      <SearchResults
        products={response.products}
        count={response.count}
        searchTerm={searchTerm.trim()}
        page={pageNumber}
        region={region}
        sortBy={safeSortBy}
        customer={customer}
        loyaltyAccount={loyaltyAccount}
        membershipProductIds={membershipProductIds}
      />
    </div>
  )
}
