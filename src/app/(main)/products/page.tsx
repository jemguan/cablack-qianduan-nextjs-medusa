import { Metadata } from "next"

import { getCountryCode } from "@lib/data/regions"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

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

