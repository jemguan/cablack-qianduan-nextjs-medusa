import { Metadata } from "next"

import { getCountryCode } from "@lib/data/regions"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

// 强制动态渲染 - 避免构建时因后端不可用而失败
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Products",
  description: "Explore all of our products.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
}

export default async function ProductsPage(props: Params) {
  const searchParams = await props.searchParams
  const { sortBy, page } = searchParams
  const countryCode = await getCountryCode()

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={countryCode}
    />
  )
}

