import { HttpTypes } from "@medusajs/types"
import type { PageTitleConfig } from "@lib/data/page-title-config"
import type { Review } from "@lib/data/reviews"

type SchemaType = "Product" | "BreadcrumbList" | "Organization" | "Article" | "FAQPage" | "WebSite" | "CollectionPage"

type SchemaProps = {
  type: SchemaType
  data: any
  baseUrl?: string
}

const Schema = ({ type, data, baseUrl }: SchemaProps) => {
  let schemaData = {}

  // Ensure we have a valid base URL for absolute links
  const siteUrl = baseUrl ||
    (typeof window !== "undefined" ? window.location.origin : "") ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://cablack.com"

  if (type === "Product") {
    // ... Product schema logic (unchanged)
    const product = data as HttpTypes.StoreProduct & {
      brand?: { name: string }
      aggregateRating?: number | null
      reviewCount?: number | null
      reviews?: Review[]
      siteConfig?: PageTitleConfig | null
    }
    const cheapestPrice = product.variants?.reduce((lowest: any, variant: any) => {
      const price = variant.calculated_price?.calculated_amount
      if (!lowest || (price && price < lowest)) return price
      return lowest
    }, null)

    const offers: Record<string, any> = {
      "@type": "Offer",
      price: cheapestPrice,
      priceCurrency: "CAD",
      availability: product.variants?.some(v => v.inventory_quantity && v.inventory_quantity > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${siteUrl}/products/${product.handle}`,
    }

    if (product.siteConfig?.has_merchant_return_policy) {
      offers.hasMerchantReturnPolicy = product.siteConfig.has_merchant_return_policy
    }

    if (product.siteConfig?.shipping_details) {
      offers.shippingDetails = product.siteConfig.shipping_details
    }

    // 收集所有产品图片（包括 thumbnail 和 images）
    const allImages: string[] = []
    if (product.thumbnail) {
      allImages.push(product.thumbnail)
    }
    if (product.images && product.images.length > 0) {
      product.images.forEach(img => {
        if (img.url && !allImages.includes(img.url)) {
          allImages.push(img.url)
        }
      })
    }

    schemaData = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description: product.description || product.subtitle || product.title,
      image: allImages.length > 0 ? allImages : undefined,
      sku: product.variants?.[0]?.sku || product.handle,
      brand: {
        "@type": "Brand",
        name: product.brand?.name || "Cablack",
      },
      offers,
      // Add aggregateRating if review data is available
      ...(typeof product.aggregateRating === "number" && product.reviewCount && product.reviewCount > 0 && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: product.aggregateRating,
          reviewCount: product.reviewCount
        }
      }),
      ...(product.reviews && product.reviews.length > 0 && {
        review: product.reviews.map((review) => ({
          "@type": "Review",
          ...(review.title ? { name: review.title } : {}),
          reviewBody: review.content,
          datePublished: review.created_at,
          author: {
            "@type": "Person",
            name: review.display_name || review.email || "Customer",
          },
          reviewRating: {
            "@type": "Rating",
            ratingValue: review.rating,
            bestRating: "5",
            worstRating: "1",
          },
        }))
      }),
    }
  } else if (type === "BreadcrumbList") {
    schemaData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: data.map((item: { name: string; url: string }, index: number) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url.startsWith("http") ? item.url : `${siteUrl}${item.url}`,
      })),
    }
  } else if (type === "WebSite") {
    schemaData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: data?.website_name || "Cablack",
      url: siteUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}${data?.website_search_url || "/search?q={search_term_string}"}`
        },
        "query-input": "required name=search_term_string"
      }
    }
  } else if (type === "Organization") {
    schemaData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: data?.organization_name || "Cablack",
      url: siteUrl,
      logo: data?.organization_logo_url || `${siteUrl}/logo.png`,
      sameAs: data?.organization_social_links || []
    }
  } else if (type === "CollectionPage") {
    schemaData = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: data.name,
      description: data.description || "",
      url: data.url ? (data.url.startsWith("http") ? data.url : `${siteUrl}${data.url}`) : siteUrl,
      ...(data.image && { image: data.image })
    }
  } else if (type === "FAQPage") {
    schemaData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: data.map((faq: { question: string; answer: string }) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer
        }
      }))
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemaData),
      }}
    />
  )
}

export default Schema
