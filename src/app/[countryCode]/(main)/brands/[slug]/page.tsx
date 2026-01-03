import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getBrandBySlug } from "@lib/data/brands"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import BrandTemplate from "@modules/brands/templates"
import Breadcrumb from "@modules/common/components/breadcrumb"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

// 强制动态渲染，因为使用了 searchParams
export const dynamic = 'force-dynamic'
export const dynamicParams = true

type Props = {
  params: Promise<{ slug: string; countryCode: string }>
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
    const metaTitle = brand.meta_title || `${brand.name} | Medusa Store`
    const metaDescription = brand.meta_description || `Shop ${brand.name} products at Medusa Store`

    const metadata = {
      title: metaTitle,
      description: metaDescription,
    } as Metadata

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

    if (!params.slug) {
      notFound()
    }

    const brand = await getBrandBySlug(params.slug)

    if (!brand) {
      notFound()
    }

    const breadcrumbItems = [
      { label: "Home", href: "/" },
      { label: "Brands", href: "/brands" },
      { label: brand.name },
    ]

    return (
      <>
        {/* Breadcrumb container below header */}
        <div className="border-b border-ui-border-base bg-background">
          <div className="content-container py-2">
            <Breadcrumb items={breadcrumbItems} countryCode={params.countryCode} />
          </div>
        </div>

        {/* Brand content */}
        <BrandTemplate
          brand={brand}
          page={page}
          sortBy={sortBy}
          countryCode={params.countryCode}
        />
      </>
    )
  } catch (error) {
    console.error("Error rendering brand page:", error)
    notFound()
  }
}

