import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCollectionByHandle, listCollections } from "@lib/data/collections"
import { getCountryCode } from "@lib/data/regions"
import { getPageTitle } from "@lib/data/page-title-config"
import { StoreCollection } from "@medusajs/types"
import CollectionTemplate from "@modules/collections/templates"
import Breadcrumb from "@modules/common/components/breadcrumb"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import Schema from "@modules/common/components/seo/Schema"
import { getBaseURL } from "@lib/util/env"

type Props = {
  params: Promise<{ handle: string }>
  searchParams: Promise<{
    page?: string
    sortBy?: SortOptions
  }>
}

export const PRODUCT_LIMIT = 12

export async function generateStaticParams() {
  try {
    const { collections } = await listCollections({
      fields: "*products",
    })

    if (!collections) {
      return []
    }

    // No countryCode in URL anymore, just generate handles
    return collections.map((collection: StoreCollection) => ({
      handle: collection.handle,
    }))
  } catch (error) {
    // 构建时如果无法连接到后端，返回空数组
    // Next.js 会使用动态渲染而不是静态生成
    console.warn('Failed to generate static params for collections:', error)
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const collection = await getCollectionByHandle(params.handle)

  if (!collection) {
    notFound()
  }

  // 使用 .trim() 来判断，这样空格 " " 可以作为占位符，触发 fallback
  const metadata = collection.metadata || {}
  const title = (metadata.seo_title as string)?.trim() || (await getPageTitle("collection", { title: collection.title }))
  const description = (metadata.seo_description as string)?.trim() || `${collection.title} collection`

  return {
    title,
    description,
    alternates: {
      canonical: `${getBaseURL()}/collections/${params.handle}`,
    },
    openGraph: {
      title,
      description,
      url: `${getBaseURL()}/collections/${params.handle}`,
    }
  }
}

export default async function CollectionPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams
  const countryCode = await getCountryCode()

  const collection = await getCollectionByHandle(params.handle).then(
    (collection: StoreCollection) => collection
  )

  if (!collection) {
    notFound()
  }

  const breadcrumbItems = [
    { label: "Home", href: "/", name: "Home", url: "/" },
    { label: "Collections", href: "/collections", name: "Collections", url: "/collections" },
    { label: collection.title, href: `/collections/${params.handle}`, name: collection.title, url: `/collections/${params.handle}` },
  ]

  const schemaBreadcrumbs = breadcrumbItems.map(item => ({
    name: item.name,
    url: item.url
  }))

  return (
    <>
      <Schema type="BreadcrumbList" data={schemaBreadcrumbs} />

      {/* Breadcrumb container below header */}
      <div className="border-b border-ui-border-base bg-background">
        <div className="content-container py-2">
          <Breadcrumb items={breadcrumbItems} countryCode={countryCode} />
        </div>
      </div>

      {/* Collection content */}
      <CollectionTemplate
        collection={collection}
        page={page}
        sortBy={sortBy}
        countryCode={countryCode}
      />
    </>
  )
}
