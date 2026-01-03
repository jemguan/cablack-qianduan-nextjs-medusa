import { MetadataRoute } from "next"
import { listRegions } from "@lib/data/regions"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { listBrands } from "@lib/data/brands"
import { listBlogs } from "@lib/data/blogs"
import { sdk } from "@lib/config"

// Default region for sitemap generation
const DEFAULT_REGION = "ca"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 优先使用 NEXT_PUBLIC_SITE_URL，然后是 NEXT_PUBLIC_BASE_URL，最后是 NEXT_PUBLIC_VERCEL_URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.replace(":9000", ":8000") ||
        "http://localhost:8000")

  const sitemapEntries: MetadataRoute.Sitemap = []

  try {
    // Get regions to find the default region for product fetching
    const regions = await listRegions()
    const defaultRegion = regions?.find((r) =>
      r.countries?.some((c) => c.iso_2 === DEFAULT_REGION)
    ) || regions?.[0]

    // Add static pages (no countryCode in URL)
    // Home page
    sitemapEntries.push({
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    })

    // Static pages
    sitemapEntries.push({
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    })

    sitemapEntries.push({
      url: `${baseUrl}/store`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    })

    sitemapEntries.push({
      url: `${baseUrl}/blogs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    })

    sitemapEntries.push({
      url: `${baseUrl}/collections`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    })

    sitemapEntries.push({
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    })

    sitemapEntries.push({
      url: `${baseUrl}/brands`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    })

    // Get all products (use default region for fetching)
    if (defaultRegion) {
      try {
        let offset = 0
        const limit = 100
        let hasMore = true

        while (hasMore) {
          try {
            const response = await sdk.client.fetch<{
              products: Array<{ handle?: string }>
              count: number
            }>(
              `/store/products`,
              {
                method: "GET",
                query: {
                  limit: limit.toString(),
                  offset: offset.toString(),
                  region_id: defaultRegion.id,
                  fields: "handle",
                },
                next: {
                  revalidate: 3600,
                },
                cache: "force-cache" as const,
              }
            )

            if (response.products && response.products.length > 0) {
              response.products.forEach((product) => {
                if (product.handle) {
                  const encodedHandle = encodeURIComponent(product.handle)
                  sitemapEntries.push({
                    url: `${baseUrl}/products/${encodedHandle}`,
                    lastModified: new Date(),
                    changeFrequency: "weekly",
                    priority: 0.8,
                  })
                }
              })

              hasMore = response.products.length === limit
              offset += limit
            } else {
              hasMore = false
            }
          } catch (error) {
            console.error("Error fetching products for sitemap:", error)
            hasMore = false
          }
        }
      } catch (error) {
        console.error("Error generating product URLs:", error)
      }
    }

    // Get all categories
    try {
      const categories = await listCategories({ limit: 1000 })

      if (categories && categories.length > 0) {
        for (const category of categories) {
          if (!category.handle) continue

          const buildCategoryPath = (cat: typeof category): string[] => {
            const path: string[] = []
            let current: typeof category | null = cat

            while (current) {
              if (current.handle) {
                path.unshift(current.handle)
              }
              current = (current as any).parent_category || null
            }

            return path
          }

          const categoryPath = buildCategoryPath(category)
          const encodedCategoryPath = categoryPath.map(handle => encodeURIComponent(handle)).join("/")

          sitemapEntries.push({
            url: `${baseUrl}/categories/${encodedCategoryPath}`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
          })
        }
      }
    } catch (error) {
      console.error("Error generating category URLs:", error)
    }

    // Get all collections
    try {
      const { collections } = await listCollections({
        limit: "1000",
        offset: "0",
      })

      if (collections && collections.length > 0) {
        for (const collection of collections) {
          if (!collection.handle) continue

          const encodedHandle = encodeURIComponent(collection.handle)

          sitemapEntries.push({
            url: `${baseUrl}/collections/${encodedHandle}`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
          })
        }
      }
    } catch (error) {
      console.error("Error generating collection URLs:", error)
    }

    // Get all brands
    try {
      const { brands } = await listBrands({
        limit: "1000",
        offset: "0",
      })

      if (brands && brands.length > 0) {
        for (const brand of brands) {
          if (!brand.slug) continue

          const encodedSlug = encodeURIComponent(brand.slug)

          sitemapEntries.push({
            url: `${baseUrl}/brands/${encodedSlug}`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.6,
          })
        }
      }
    } catch (error) {
      console.error("Error generating brand URLs:", error)
    }

    // Get all published blogs
    try {
      const { posts } = await listBlogs({
        limit: "1000",
        offset: "0",
      })

      if (posts && posts.length > 0) {
        const publishedPosts = posts.filter(
          (post) => post.status === "published" && post.url
        )

        for (const post of publishedPosts) {
          if (!post.url) continue

          sitemapEntries.push({
            url: `${baseUrl}/blogs/${encodeURIComponent(post.url)}`,
            lastModified: post.updated_at
              ? new Date(post.updated_at)
              : new Date(),
            changeFrequency: "monthly",
            priority: 0.6,
          })
        }
      }
    } catch (error) {
      console.error("Error generating blog URLs:", error)
    }
  } catch (error) {
    console.error("Error generating sitemap:", error)
  }

  return sitemapEntries
}
