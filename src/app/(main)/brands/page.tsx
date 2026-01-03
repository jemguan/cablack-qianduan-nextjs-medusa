import { Metadata } from "next"

import { listBrands } from "@lib/data/brands"
import { getCountryCode } from "@lib/data/regions"
import BrandsListTemplate from "@modules/brands/templates/brands-list"
import Breadcrumb from "@modules/common/components/breadcrumb"

export const metadata: Metadata = {
  title: "Brands",
  description: "Explore all of our brands.",
}

export default async function BrandsPage() {
  const countryCode = await getCountryCode()

  const { brands } = await listBrands({
    limit: "100",
    offset: "0",
  })

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Brands" },
  ]

  return (
    <>
      {/* Breadcrumb container below header */}
      <div className="border-b border-ui-border-base bg-background">
        <div className="content-container py-2">
          <Breadcrumb items={breadcrumbItems} countryCode={countryCode} />
        </div>
      </div>

      {/* Brands list content */}
      <BrandsListTemplate
        brands={brands}
        countryCode={countryCode}
      />
    </>
  )
}
