import { Metadata } from "next"

import { listBrands } from "@lib/data/brands"
import { getCountryCode } from "@lib/data/regions"
import { getPageTitle } from "@lib/data/page-title-config"
import BrandsListTemplate from "@modules/brands/templates/brands-list"
import Breadcrumb from "@modules/common/components/breadcrumb"
import Schema from "@modules/common/components/seo/Schema"
import { getBaseURL } from "@lib/util/env"

// 强制动态渲染 - 避免构建时因后端不可用而失败
export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const title = await getPageTitle("brand_list", { title: "Brands" })
  const description = "Explore all of our brands."
  const baseUrl = getBaseURL()
  const brandsUrl = `${baseUrl}/brands`

  return {
    title,
    description,
    alternates: {
      canonical: brandsUrl,
    },
    openGraph: {
      title,
      description,
      url: brandsUrl,
      type: 'website',
    },
  }
}

export default async function BrandsPage() {
  const countryCode = await getCountryCode()

  const { brands } = await listBrands({
    limit: "100",
    offset: "0",
  })

  const breadcrumbItems = [
    { label: "Home", href: "/", name: "Home", url: "/" },
    { label: "Brands", name: "Brands", url: "/brands" },
  ]

  // Prepare Schema Breadcrumbs
  const schemaBreadcrumbs = breadcrumbItems.map(item => ({
    name: item.name,
    url: item.url
  }))

  return (
    <>
      {/* SEO Structured Data */}
      <Schema type="BreadcrumbList" data={schemaBreadcrumbs} />

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
