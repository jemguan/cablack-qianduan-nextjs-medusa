import { MetadataRoute } from "next"
import { listRegions } from "@lib/data/regions"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { listBrands } from "@lib/data/brands"
import { listBlogs } from "@lib/data/blogs"
import { sdk } from "@lib/config"

// Default region for sitemap generation
const DEFAULT_REGION = "ca"

/**
 * 获取 Sitemap 的基础 URL
 * 开发环境: http://localhost:8000
 * 生产环境: NEXT_PUBLIC_SITE_URL 或 NEXT_PUBLIC_BASE_URL
 */
function getBaseUrl(): string {
  // 生产环境优先使用配置的站点 URL
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "") // 移除末尾斜杠
  }

  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "")
  }

  // Vercel 部署
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }

  // 开发环境默认
  return "http://localhost:8000"
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl()
  const sitemapEntries: MetadataRoute.Sitemap = []
  const now = new Date()

  try {
    // Get regions to find the default region for product fetching
    const regions = await listRegions()
    const defaultRegion = regions?.find((r) =>
      r.countries?.some((c) => c.iso_2 === DEFAULT_REGION)
    ) || regions?.[0]

    // ==================== 静态页面 ====================
    // 首页 - 最高优先级
    sitemapEntries.push({
      url: baseUrl,
      lastModified: now,
    })

    // 主要导航页面
    const staticPages = [
      "/store",
      "/search",
      "/blogs",
      "/collections",
      "/categories",
      "/brands",
    ]

    for (const page of staticPages) {
      sitemapEntries.push({
        url: `${baseUrl}${page}`,
        lastModified: now,
      })
    }

    // ==================== 产品页面（带图片）====================
    if (defaultRegion) {
      try {
        let offset = 0
        const limit = 100
        let hasMore = true

        while (hasMore) {
          try {
            const response = await sdk.client.fetch<{
              products: Array<{
                handle?: string
                updated_at?: string
                created_at?: string
                thumbnail?: string
                images?: Array<{ url?: string }>
              }>
              count: number
            }>(
              `/store/products`,
              {
                method: "GET",
                query: {
                  limit: limit.toString(),
                  offset: offset.toString(),
                  region_id: defaultRegion.id,
                  fields: "handle,updated_at,created_at,thumbnail,images.url",
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

                  // 收集产品图片 URL
                  const imageUrls: string[] = []

                  // 添加缩略图
                  if (product.thumbnail) {
                    imageUrls.push(product.thumbnail)
                  }

                  // 添加产品图片（最多 10 张）
                  if (product.images && product.images.length > 0) {
                    product.images.slice(0, 10).forEach((img) => {
                      if (img.url && !imageUrls.includes(img.url)) {
                        imageUrls.push(img.url)
                      }
                    })
                  }

                  const entry: MetadataRoute.Sitemap[number] = {
                    url: `${baseUrl}/products/${encodedHandle}`,
                    lastModified: product.updated_at
                      ? new Date(product.updated_at)
                      : product.created_at
                        ? new Date(product.created_at)
                        : now,
                  }

                  // 添加图片（如果有）
                  if (imageUrls.length > 0) {
                    entry.images = imageUrls
                  }

                  sitemapEntries.push(entry)
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

    // ==================== 分类页面 ====================
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
          const encodedCategoryPath = categoryPath
            .map((handle) => encodeURIComponent(handle))
            .join("/")

          sitemapEntries.push({
            url: `${baseUrl}/categories/${encodedCategoryPath}`,
            lastModified: (category as any).updated_at
              ? new Date((category as any).updated_at)
              : now,
          })
        }
      }
    } catch (error) {
      console.error("Error generating category URLs:", error)
    }

    // ==================== 集合页面 ====================
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
            lastModified: (collection as any).updated_at
              ? new Date((collection as any).updated_at)
              : now,
          })
        }
      }
    } catch (error) {
      console.error("Error generating collection URLs:", error)
    }

    // ==================== 品牌页面 ====================
    try {
      const { brands } = await listBrands({
        limit: "1000",
        offset: "0",
      })

      if (brands && brands.length > 0) {
        for (const brand of brands) {
          if (!brand.slug) continue

          const encodedSlug = encodeURIComponent(brand.slug)

          // 品牌可能有 logo 图片
          const entry: MetadataRoute.Sitemap[number] = {
            url: `${baseUrl}/brands/${encodedSlug}`,
            lastModified: (brand as any).updated_at
              ? new Date((brand as any).updated_at)
              : now,
          }

          // 如果品牌有 logo，添加到图片列表
          if ((brand as any).logo_url) {
            entry.images = [(brand as any).logo_url]
          }

          sitemapEntries.push(entry)
        }
      }
    } catch (error) {
      console.error("Error generating brand URLs:", error)
    }

    // ==================== 博客文章 ====================
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

          const entry: MetadataRoute.Sitemap[number] = {
            url: `${baseUrl}/blogs/${encodeURIComponent(post.url)}`,
            lastModified: post.updated_at
              ? new Date(post.updated_at)
              : post.created_at
                ? new Date(post.created_at)
                : now,
          }

          // 如果博客有封面图，添加到图片列表
          if ((post as any).cover_image || (post as any).featured_image) {
            entry.images = [
              (post as any).cover_image || (post as any).featured_image,
            ]
          }

          sitemapEntries.push(entry)
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
