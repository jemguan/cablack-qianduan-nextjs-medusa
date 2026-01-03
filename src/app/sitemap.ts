import { MetadataRoute } from "next"
import { listRegions } from "@lib/data/regions"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { listBrands } from "@lib/data/brands"
import { listBlogs } from "@lib/data/blogs"
import { sdk } from "@lib/config"
import { getCacheConfig } from "@lib/config/cache"


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
    // Get all regions and country codes
    const regions = await listRegions()
    const countryCodes =
      regions
        ?.map((r) => r.countries?.map((c) => c.iso_2))
        .flat()
        .filter(Boolean) || []

    if (countryCodes.length === 0) {
      // Fallback to default country code if no regions found
      countryCodes.push("us")
    }

    // Add static pages for each country code
    for (const countryCode of countryCodes) {
      // Home page
      sitemapEntries.push({
        url: `${baseUrl}/${countryCode}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1.0,
      })

      // Static pages
      sitemapEntries.push({
        url: `${baseUrl}/${countryCode}/search`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      })

      sitemapEntries.push({
        url: `${baseUrl}/${countryCode}/store`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      })

      sitemapEntries.push({
        url: `${baseUrl}/${countryCode}/blogs`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.7,
      })

      sitemapEntries.push({
        url: `${baseUrl}/${countryCode}/collections`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      })

      sitemapEntries.push({
        url: `${baseUrl}/${countryCode}/categories`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      })

      sitemapEntries.push({
        url: `${baseUrl}/${countryCode}/brands`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      })
    }

    // Get all products and generate URLs for each country code
    // Note: Products are fetched directly via SDK with static caching for build-time generation
    try {
      for (const countryCode of countryCodes) {
        const region = regions?.find((r) =>
          r.countries?.some((c) => c.iso_2 === countryCode)
        )

        if (!region) continue

        // Fetch products in batches using SDK directly with static cache
        let offset = 0
        const limit = 100
        let hasMore = true

        while (hasMore) {
          try {
            // Use static cache for sitemap generation (we only need handles, not prices/inventory)
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
                  region_id: region.id,
                  fields: "handle",
                },
                next: {
                  revalidate: 3600, // Revalidate every hour for static generation
                },
                cache: "force-cache" as const, // Force static cache for build-time generation
              }
            )

            if (response.products && response.products.length > 0) {
              response.products.forEach((product) => {
                if (product.handle) {
                  // 编码产品 handle 以确保 URL 安全
                  const encodedHandle = encodeURIComponent(product.handle)
                  sitemapEntries.push({
                    url: `${baseUrl}/${countryCode}/products/${encodedHandle}`,
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
            console.error(
              `Error fetching products for ${countryCode}:`,
              error
            )
            hasMore = false
          }
        }
      }
    } catch (error) {
      console.error("Error generating product URLs:", error)
    }

    // Get all categories
    try {
      const categories = await listCategories({ limit: 1000 })

      if (categories && categories.length > 0) {
        for (const category of categories) {
          if (!category.handle) continue

          // Build category path (handle nested categories)
          const buildCategoryPath = (
            cat: typeof category
          ): string[] => {
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
          // 编码每个 category handle
          const encodedCategoryPath = categoryPath.map(handle => encodeURIComponent(handle)).join("/")

          for (const countryCode of countryCodes) {
            sitemapEntries.push({
              url: `${baseUrl}/${countryCode}/categories/${encodedCategoryPath}`,
              lastModified: new Date(),
              changeFrequency: "weekly",
              priority: 0.7,
            })
          }
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

          // 编码 collection handle
          const encodedHandle = encodeURIComponent(collection.handle)

          for (const countryCode of countryCodes) {
            sitemapEntries.push({
              url: `${baseUrl}/${countryCode}/collections/${encodedHandle}`,
              lastModified: new Date(),
              changeFrequency: "weekly",
              priority: 0.7,
            })
          }
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

          // 编码 brand slug
          const encodedSlug = encodeURIComponent(brand.slug)

          for (const countryCode of countryCodes) {
            sitemapEntries.push({
              url: `${baseUrl}/${countryCode}/brands/${encodedSlug}`,
              lastModified: new Date(),
              changeFrequency: "weekly",
              priority: 0.6,
            })
          }
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

          for (const countryCode of countryCodes) {
            sitemapEntries.push({
              url: `${baseUrl}/${countryCode}/blogs/${encodeURIComponent(post.url)}`,
              lastModified: post.updated_at
                ? new Date(post.updated_at)
                : new Date(),
              changeFrequency: "monthly",
              priority: 0.6,
            })
          }
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

