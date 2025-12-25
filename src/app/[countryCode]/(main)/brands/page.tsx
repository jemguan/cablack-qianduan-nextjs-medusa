import { Metadata } from "next"

import { listBrands } from "@lib/data/brands"
import BrandsListTemplate from "@modules/brands/templates/brands-list"

export const metadata: Metadata = {
  title: "Brands",
  description: "Explore all of our brands.",
}

type Params = {
  params: Promise<{
    countryCode: string
  }>
}

export default async function BrandsPage(props: Params) {
  const params = await props.params;

  const { brands } = await listBrands({
    limit: "100",
    offset: "0",
  })

  return (
    <BrandsListTemplate
      brands={brands}
      countryCode={params.countryCode}
    />
  )
}

