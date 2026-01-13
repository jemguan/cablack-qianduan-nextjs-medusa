import { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import { listProducts } from "@lib/data/products"
import { getCurrentRegion, getCountryCode } from "@lib/data/regions"
import { getProductHtmlDescription } from "@lib/data/product-html-description"
import { getPageTitle } from "@lib/data/page-title-config"
import ProductTemplate from "@modules/products/templates"
import Breadcrumb from "@modules/common/components/breadcrumb"
import { ReviewStatsProvider } from "@modules/products/components/reviews/ReviewStatsContext"
import { HttpTypes } from "@medusajs/types"
import Schema from "@modules/common/components/seo/Schema"
import { getBaseURL } from "@lib/util/env"
import { getProductBrand } from "@lib/data/brands"
import { getProductOptionTemplates } from "@lib/data/option-templates"

type Props = {
  params: Promise<{ handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

/**
 * 使用 React cache() 去重产品获取请求
 * generateMetadata 和 ProductPage 会在同一请求周期内共享缓存
 * 避免重复的 API 调用
 */
const getProductByHandle = cache(async (handle: string, includeCategories: boolean = false) => {
  const fields = includeCategories
    ? "+*categories,+*categories.parent_category,+*categories.parent_category.parent_category"
    : undefined

  const { response } = await listProducts({
    queryParams: {
      handle,
      ...(fields && { fields }),
    },
  })

  return response.products[0] || null
})

// 注意：由于页面使用了 cookies() 和 searchParams，需要动态渲染
// 如果未来需要静态生成，需要重构以在静态生成时不使用 cookies
export const dynamic = 'force-dynamic'
export const dynamicParams = true

// 可选：保留 generateStaticParams 用于预生成常用产品页面
// 但需要确保在静态生成时不使用 cookies
// export async function generateStaticParams() {
//   try {
//     // For static generation, we generate params for handles only (no countryCode in URL)
//     const { response } = await listProducts({
//       queryParams: { limit: 100, fields: "handle" },
//     })

//     return response.products
//       .filter((product) => product.handle)
//       .map((product) => ({
//         handle: product.handle,
//       }))
//   } catch (error) {
//     console.error(
//       `Failed to generate static paths for product pages: ${error instanceof Error ? error.message : "Unknown error"
//       }.`
//     )
//     return []
//   }
// }

function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
) {
  if (!selectedVariantId || !product.variants) {
    return product.images
  }

  const variant = product.variants!.find((v) => v.id === selectedVariantId)
  if (!variant || !variant.images || !variant.images.length) {
    return product.images
  }

  const imageIdsMap = new Map(variant.images.map((i) => [i.id, true]))
  return product.images!.filter((i) => imageIdsMap.has(i.id))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const region = await getCurrentRegion()

  if (!region) {
    notFound()
  }

  // 使用缓存的产品获取函数（与 ProductPage 共享缓存）
  const product = await getProductByHandle(handle, true)

  if (!product) {
    notFound()
  }

  // 优先使用 Metadata 中的 SEO 配置，否则使用默认逻辑
  // 使用 .trim() 来判断，这样空格 " " 可以作为占位符，触发 fallback
  const metadata = product.metadata || {}
  const seoTitle = (metadata.seo_title as string)?.trim() || (await getPageTitle("product", { title: product.title }))
  const seoDescription = (metadata.seo_description as string)?.trim() || product.subtitle || product.description || `${product.title} - Cablack`

  return {
    title: seoTitle,
    description: seoDescription,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      images: product.thumbnail ? [product.thumbnail] : [],
      url: `${getBaseURL()}/products/${handle}`,
    },
    alternates: {
      canonical: `${getBaseURL()}/products/${handle}`,
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const countryCode = await getCountryCode()
  const region = await getCurrentRegion()
  const searchParams = await props.searchParams

  const selectedVariantId = searchParams.v_id

  if (!region) {
    notFound()
  }

  // 使用缓存的产品获取函数（与 generateMetadata 共享缓存）
  const pricedProduct = await getProductByHandle(params.handle, true)

  if (!pricedProduct) {
    notFound()
  }

  const images = getImagesForVariant(pricedProduct, selectedVariantId)

  // 获取产品 HTML 描述
  const htmlDescription = await getProductHtmlDescription(pricedProduct.id)

  // 获取产品选项模板
  const optionTemplates = await getProductOptionTemplates(pricedProduct.id)

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: "Home", href: "/", name: "Home", url: "/" },
  ]

  // Add category to breadcrumb if product has a category
  if (pricedProduct.categories && pricedProduct.categories.length > 0) {
    const category = pricedProduct.categories[0]

    // Build category path (handle parent categories)
    const categoryPath: string[] = []
    let currentCategory: HttpTypes.StoreProductCategory | null = category

    while (currentCategory) {
      if (currentCategory.handle) {
        categoryPath.unshift(currentCategory.handle)
      }
      currentCategory = currentCategory.parent_category || null
    }

    if (categoryPath.length > 0) {
      breadcrumbItems.push({
        label: category.name || "Category",
        href: `/categories/${categoryPath.join("/")}`,
        name: category.name || "Category",
        url: `/categories/${categoryPath.join("/")}`
      })
    }
  }

  // Add product title (current page)
  breadcrumbItems.push({
    label: pricedProduct.title,
    href: `/products/${params.handle}`,
    name: pricedProduct.title,
    url: `/products/${params.handle}`
  })

  // Prepare simple breadcrumb list for Schema (name, url pair matching standard)
  const schemaBreadcrumbs = breadcrumbItems.map(item => ({
    name: item.name,
    url: item.url
  }))

  // Fetch brand information for SEO
  const brand = await getProductBrand(pricedProduct.id)

  return (
    <ReviewStatsProvider>
      {/* Structural Data for SEO */}
      <Schema
        type="Product"
        data={{
          ...pricedProduct,
          brand: brand ? { name: brand.name } : undefined
        }}
      />
      <Schema type="BreadcrumbList" data={schemaBreadcrumbs} />

      {/* Breadcrumb container below header */}
      <div className="border-b border-ui-border-base bg-background">
        <div className="content-container py-2">
          <Breadcrumb items={breadcrumbItems} countryCode={countryCode} />
        </div>
      </div>

      {/* Product content */}
      <ProductTemplate
        product={pricedProduct}
        region={region}
        countryCode={countryCode}
        images={images || []}
        initialVariantId={selectedVariantId}
        htmlDescription={htmlDescription}
        optionTemplates={optionTemplates}
      />
    </ReviewStatsProvider>
  )
}
