import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import { getCountryCode } from "@lib/data/regions"
import { getPageTitle } from "@lib/data/page-title-config"
import { HttpTypes } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import Breadcrumb from "@modules/common/components/breadcrumb"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import Schema from "@modules/common/components/seo/Schema"
import { getBaseURL } from "@lib/util/env"

type Props = {
  params: Promise<{ category: string[] }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
}

export async function generateStaticParams() {
  try {
    const product_categories = await listCategories()

    if (!product_categories) {
      return []
    }

    // No countryCode in URL anymore, just generate category handles
    return product_categories.map((category: any) => ({
      category: [category.handle],
    }))
  } catch (error) {
    // 构建时如果无法连接到后端，返回空数组
    // Next.js 会使用动态渲染而不是静态生成
    console.warn('Failed to generate static params for categories:', error)
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  try {
    const productCategory = await getCategoryByHandle(params.category)

    // 使用 .trim() 来判断，这样空格 " " 可以作为占位符，触发 fallback
    const metadata = productCategory.metadata || {}
    const title = (metadata.seo_title as string)?.trim() || (await getPageTitle("category", { name: productCategory.name, title: productCategory.name }))
    const description = (metadata.seo_description as string)?.trim() || productCategory.description || `${productCategory.name} category.`

    return {
      title,
      description,
      alternates: {
        canonical: `${getBaseURL()}/categories/${params.category.join("/")}`,
      },
      openGraph: {
        title,
        description,
        url: `${getBaseURL()}/categories/${params.category.join("/")}`,
        images: productCategory.metadata?.image ? [productCategory.metadata.image as string] : [],
      }
    }
  } catch (error) {
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams
  const countryCode = await getCountryCode()

  const productCategory = await getCategoryByHandle(params.category)

  if (!productCategory) {
    notFound()
  }

  // Build breadcrumb items with parent categories
  const breadcrumbItems = [
    { label: "Home", href: "/", name: "Home", url: "/" },
  ]

  // Collect all parent categories in order (from root to direct parent)
  const parents: HttpTypes.StoreProductCategory[] = []
  const getParents = (category: HttpTypes.StoreProductCategory) => {
    if (category.parent_category) {
      getParents(category.parent_category)
      parents.push(category.parent_category)
    }
  }
  getParents(productCategory)

  // Build category path helper function
  const buildCategoryPath = (category: HttpTypes.StoreProductCategory): string[] => {
    const path: string[] = []
    let current: HttpTypes.StoreProductCategory | null = category

    while (current) {
      if (current.handle) {
        path.unshift(current.handle)
      }
      current = current.parent_category || null
    }

    return path
  }

  // Add parent categories to breadcrumb (in correct order)
  parents.forEach((parent) => {
    if (parent.handle) {
      const categoryPath = buildCategoryPath(parent)
      breadcrumbItems.push({
        label: parent.name,
        href: `/categories/${categoryPath.join("/")}`,
        name: parent.name,
        url: `/categories/${categoryPath.join("/")}`
      })
    }
  })

  // Add current category
  const currentCategoryPath = buildCategoryPath(productCategory)
  breadcrumbItems.push({
    label: productCategory.name,
    // Href is not clickable for the last item usually but good for schema
    href: `/categories/${currentCategoryPath.join("/")}`,
    name: productCategory.name,
    url: `/categories/${currentCategoryPath.join("/")}`
  })

  // Prepare Schema Breadcrumbs
  const schemaBreadcrumbs = breadcrumbItems.map(item => ({
    name: item.name,
    url: item.url
  }))

  return (
    <>
      <Schema type="BreadcrumbList" data={schemaBreadcrumbs} />
      <Schema
        type="CollectionPage"
        data={{
          name: productCategory.name,
          description: productCategory.description,
          url: `/categories/${currentCategoryPath.join("/")}`,
          image: productCategory.metadata?.image as string | undefined
        }}
      />

      {/* Breadcrumb container below header */}
      <div className="border-b border-ui-border-base bg-background">
        <div className="content-container py-2">
          <Breadcrumb items={breadcrumbItems} countryCode={countryCode} />
        </div>
      </div>

      {/* Category content */}
      <CategoryTemplate
        category={productCategory}
        sortBy={sortBy}
        page={page}
        countryCode={countryCode}
      />
    </>
  )
}
