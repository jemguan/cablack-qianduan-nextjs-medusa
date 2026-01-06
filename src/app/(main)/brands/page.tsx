import { Metadata } from "next"

import { listBrands } from "@lib/data/brands"
import { getCountryCode } from "@lib/data/regions"
import { getPageTitle } from "@lib/data/page-title-config"
import BrandsListTemplate from "@modules/brands/templates/brands-list"
import Breadcrumb from "@modules/common/components/breadcrumb"

export async function generateMetadata(): Promise<Metadata> {
  const title = await getPageTitle("brand_list", { title: "Brands" })
  return {
    title,
    description: "Explore all of our brands.",
  }
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
