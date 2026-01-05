import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getCurrentRegion, getCountryCode } from "@lib/data/regions"
import { getProductHtmlDescription } from "@lib/data/product-html-description"
import ProductTemplate from "@modules/products/templates"
import Breadcrumb from "@modules/common/components/breadcrumb"
import { ReviewStatsProvider } from "@modules/products/components/reviews/ReviewStatsContext"
import { HttpTypes } from "@medusajs/types"

type Props = {
  params: Promise<{ handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

export async function generateStaticParams() {
  try {
    // For static generation, we generate params for handles only (no countryCode in URL)
    const { response } = await listProducts({
      queryParams: { limit: 100, fields: "handle" },
    })

    return response.products
      .filter((product) => product.handle)
      .map((product) => ({
        handle: product.handle,
      }))
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

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

  const product = await listProducts({
    queryParams: { 
      handle,
    },
  }).then(({ response }) => response.products[0])

  if (!product) {
    notFound()
  }

  return {
    title: `${product.title} | Onahole Station`,
    description: `${product.title}`,
    openGraph: {
      title: `${product.title} | Onahole Station`,
      description: `${product.title}`,
      images: product.thumbnail ? [product.thumbnail] : [],
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

  const pricedProduct = await listProducts({
    queryParams: {
      handle: params.handle,
      fields: "+*categories,+*categories.parent_category,+*categories.parent_category.parent_category",
    },
  }).then(({ response }) => response.products[0])

  const images = getImagesForVariant(pricedProduct, selectedVariantId)

  if (!pricedProduct) {
    notFound()
  }

  // 获取产品 HTML 描述
  const htmlDescription = await getProductHtmlDescription(pricedProduct.id)

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: "Home", href: "/" },
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
      })
    }
  }

  // Add product title (current page)
  breadcrumbItems.push({ label: pricedProduct.title })

  return (
    <ReviewStatsProvider>
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
        images={images}
        initialVariantId={selectedVariantId}
        htmlDescription={htmlDescription}
      />
    </ReviewStatsProvider>
  )
}
