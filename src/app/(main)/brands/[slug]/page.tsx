import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getBrandBySlug } from "@lib/data/brands"
import { getCountryCode } from "@lib/data/regions"
import { getPageTitle } from "@lib/data/page-title-config"
import BrandTemplate from "@modules/brands/templates"
import Breadcrumb from "@modules/common/components/breadcrumb"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import Schema from "@modules/common/components/seo/Schema"
import { getBaseURL } from "@lib/util/env"

// 强制动态渲染，因为使用了 searchParams
export const dynamic = 'force-dynamic'
export const dynamicParams = true

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    page?: string
    sortBy?: SortOptions
  }>
}

export const PRODUCT_LIMIT = 12

export async function generateStaticParams() {
  // 品牌页面使用动态渲染，不预生成静态路径
  // 因为品牌数量可能很多，且会动态变化
  return []
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  try {
    const params = await props.params

    if (!params.slug) {
      notFound()
    }

    const brand = await getBrandBySlug(params.slug)

    if (!brand) {
      notFound()
    }

    // 使用元标题和元描述，如果为空则使用默认值
    const title = await getPageTitle("brand_detail", { name: brand.name, title: brand.name })
    const metaDescription = brand.meta_description || `Shop ${brand.name} products at Onahole Station`
    const baseUrl = getBaseURL()
    const brandUrl = `${baseUrl}/brands/${params.slug}`

    const metadata: Metadata = {
      title: brand.meta_title || title,
      description: metaDescription,
      alternates: {
        canonical: brandUrl,
      },
      openGraph: {
        title: brand.meta_title || title,
        description: metaDescription,
        url: brandUrl,
        images: brand.logo_url ? [brand.logo_url] : [],
        type: 'website',
      },
    }

    return metadata
  } catch (error) {
    console.error("Error generating metadata for brand page:", error)
    notFound()
  }
}

export default async function BrandPage(props: Props) {
  try {
    const searchParams = await props.searchParams
    const params = await props.params
    const { sortBy, page } = searchParams
    const countryCode = await getCountryCode()

    if (!params.slug) {
      notFound()
    }

    const brand = await getBrandBySlug(params.slug)

    if (!brand) {
      notFound()
    }

    const breadcrumbItems = [
      { label: "Home", href: "/", name: "Home", url: "/" },
      { label: "Brands", href: "/brands", name: "Brands", url: "/brands" },
      { label: brand.name, name: brand.name, url: `/brands/${params.slug}` },
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
        <Schema
          type="Organization"
          data={{
            organization_name: brand.name,
            organization_logo_url: brand.logo_url,
            website_name: brand.name,
          }}
        />

        {/* Breadcrumb container below header */}
        <div className="border-b border-ui-border-base bg-background">
          <div className="content-container py-2">
            <Breadcrumb items={breadcrumbItems} countryCode={countryCode} />
          </div>
        </div>

        {/* Brand content */}
        <BrandTemplate
          brand={brand}
          page={page}
          sortBy={sortBy}
          countryCode={countryCode}
        />
      </>
    )
  } catch (error) {
    console.error("Error rendering brand page:", error)
    notFound()
  }
}
