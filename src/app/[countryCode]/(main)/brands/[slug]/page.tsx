import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getBrandBySlug } from "@lib/data/brands"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import BrandTemplate from "@modules/brands/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type Props = {
  params: Promise<{ slug: string; countryCode: string }>
  searchParams: Promise<{
    page?: string
    sortBy?: SortOptions
  }>
}

export const PRODUCT_LIMIT = 12

export async function generateStaticParams() {
  try {
    const { brands } = await getBrandBySlug("").then(() => ({ brands: [] })).catch(() => ({ brands: [] }))
    
    // 由于无法直接获取所有品牌，这里返回空数组，使用动态渲染
    return []
  } catch (error) {
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
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
}

export default async function BrandPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams

  const brand = await getBrandBySlug(params.slug)

  if (!brand) {
    notFound()
  }

  return (
    <BrandTemplate
      brand={brand}
      page={page}
      sortBy={sortBy}
      countryCode={params.countryCode}
    />
  )
}

