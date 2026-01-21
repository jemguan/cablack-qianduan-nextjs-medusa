import { Metadata } from "next"
import { getCountryCode } from "@lib/data/regions"
import { listProducts } from "@lib/data/products"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { listBrands } from "@lib/data/brands"
import { listBlogs } from "@lib/data/blogs"
import { listPages } from "@lib/data/pages"
import Breadcrumb from "@modules/common/components/breadcrumb"
import Link from "next/link"

// 强制动态渲染 - 避免构建时因后端不可用而失败
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Sitemap",
  description: "Browse all pages on our website.",
  robots: {
    index: true,
    follow: true,
  },
}

export default async function SitemapPage() {
  const countryCode = await getCountryCode()

  // Fetch all data
  const [categories, collections, brands, blogs, pages] = await Promise.all([
    listCategories({ limit: 1000 }).catch(() => []),
    listCollections({ limit: "1000", offset: "0" }).catch(() => ({ collections: [] })),
    listBrands({ limit: "1000", offset: "0" }).catch(() => ({ brands: [] })),
    listBlogs({ limit: "1000", offset: "0" }).catch(() => ({ posts: [] })),
    listPages({ limit: "1000", offset: "0" }).catch(() => ({ pages: [] })),
  ])

  // Get products (limit to first 500 for performance)
  let products: any[] = []
  try {
    const { response } = await listProducts({
      countryCode,
      queryParams: {
        limit: 500,
        offset: 0,
        fields: "handle,title",
      },
    })
    products = response.products || []
  } catch (error) {
    console.error("Error fetching products:", error)
  }

  // Filter published blogs
  const publishedBlogs = blogs.posts?.filter(
    (post) => post.status === "published" && post.url
  ) || []

  // Filter published pages
  const publishedPages = pages.pages?.filter(
    (page) => page.status === "published" && page.url
  ) || []

  // Build category paths helper
  const buildCategoryPath = (category: any): string[] => {
    const path: string[] = []
    let current: any = category

    while (current) {
      if (current.handle) {
        path.unshift(current.handle)
      }
      current = current.parent_category || null
    }

    return path
  }

  // Get top-level categories
  const topLevelCategories = categories.filter(
    (cat) => !cat.parent_category
  )

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Sitemap" },
  ]

  return (
    <>
      {/* Breadcrumb container */}
      <div className="border-b border-ui-border-base bg-background">
        <div className="content-container py-2">
          <Breadcrumb items={breadcrumbItems} countryCode={countryCode} />
        </div>
      </div>

      <div className="content-container py-12">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl-semi mb-2">Sitemap</h1>
            <p className="text-ui-fg-subtle">
              Browse all pages on our website
            </p>
          </header>

          <div className="grid grid-cols-1 large:grid-cols-2 gap-8">
            {/* Main Pages */}
            <section>
              <h2 className="text-xl-semi mb-4 text-ui-fg-base">Main Pages</h2>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/"
                    className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover hover:underline"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/products"
                    className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover hover:underline"
                  >
                    Products
                  </Link>
                </li>
                <li>
                  <Link
                    href="/search"
                    className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover hover:underline"
                  >
                    Search
                  </Link>
                </li>
                <li>
                  <Link
                    href="/collections"
                    className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover hover:underline"
                  >
                    All Collections
                  </Link>
                </li>
                <li>
                  <Link
                    href="/categories"
                    className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover hover:underline"
                  >
                    All Categories
                  </Link>
                </li>
                <li>
                  <Link
                    href="/brands"
                    className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover hover:underline"
                  >
                    All Brands
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blogs"
                    className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover hover:underline"
                  >
                    Blog
                  </Link>
                </li>
              </ul>
            </section>

            {/* Collections */}
            <section>
              <h2 className="text-xl-semi mb-4 text-ui-fg-base">
                Collections ({collections.collections?.length || 0})
              </h2>
              {collections.collections && collections.collections.length > 0 ? (
                <ul className="space-y-2 max-h-96 overflow-y-auto">
                  {collections.collections.map((collection) => (
                    <li key={collection.id}>
                      <Link
                        href={`/collections/${collection.handle}`}
                        className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover hover:underline"
                      >
                        {collection.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-ui-fg-subtle text-sm">No collections available</p>
              )}
            </section>

            {/* Categories */}
            <section>
              <h2 className="text-xl-semi mb-4 text-ui-fg-base">
                Categories ({topLevelCategories.length})
              </h2>
              {topLevelCategories.length > 0 ? (
                <ul className="space-y-2 max-h-96 overflow-y-auto">
                  {topLevelCategories.map((category) => {
                    const categoryPath = buildCategoryPath(category)
                    return (
                      <li key={category.id}>
                        <Link
                          href={`/categories/${categoryPath.join("/")}`}
                          className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover hover:underline"
                        >
                          {category.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-ui-fg-subtle text-sm">No categories available</p>
              )}
            </section>

            {/* Brands */}
            <section>
              <h2 className="text-xl-semi mb-4 text-ui-fg-base">
                Brands ({brands.brands?.length || 0})
              </h2>
              {brands.brands && brands.brands.length > 0 ? (
                <ul className="space-y-2 max-h-96 overflow-y-auto">
                  {brands.brands.map((brand) => {
                    // 如果 slug 为空，使用 id 作为后备
                    const brandIdentifier = brand.slug || brand.id
                    return (
                      <li key={brand.id}>
                        <Link
                          href={`/brands/${brandIdentifier}`}
                          className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover hover:underline"
                        >
                          {brand.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-ui-fg-subtle text-sm">No brands available</p>
              )}
            </section>

            {/* Products */}
            <section>
              <h2 className="text-xl-semi mb-4 text-ui-fg-base">
                Products ({products.length}{products.length >= 500 ? "+" : ""})
              </h2>
              {products.length > 0 ? (
                <ul className="space-y-2 max-h-96 overflow-y-auto">
                  {products.slice(0, 100).map((product) => (
                    <li key={product.id}>
                      <Link
                        href={`/products/${product.handle}`}
                        className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover hover:underline"
                      >
                        {product.title}
                      </Link>
                    </li>
                  ))}
                  {products.length > 100 && (
                    <li className="text-ui-fg-subtle text-sm pt-2">
                      ... and {products.length - 100} more products
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-ui-fg-subtle text-sm">No products available</p>
              )}
            </section>

            {/* Blog Posts */}
            <section>
              <h2 className="text-xl-semi mb-4 text-ui-fg-base">
                Blog Posts ({publishedBlogs.length})
              </h2>
              {publishedBlogs.length > 0 ? (
                <ul className="space-y-2 max-h-96 overflow-y-auto">
                  {publishedBlogs.map((post) => (
                    <li key={post.id}>
                      <Link
                        href={`/blogs/${encodeURIComponent(post.url!)}`}
                        className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover hover:underline"
                      >
                        {post.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-ui-fg-subtle text-sm">No blog posts available</p>
              )}
            </section>

            {/* Pages */}
            <section>
              <h2 className="text-xl-semi mb-4 text-ui-fg-base">
                Pages ({publishedPages.length})
              </h2>
              {publishedPages.length > 0 ? (
                <ul className="space-y-2 max-h-96 overflow-y-auto">
                  {publishedPages.map((page) => (
                    <li key={page.id}>
                      <Link
                        href={`/pages/${encodeURIComponent(page.url!)}`}
                        className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover hover:underline"
                      >
                        {page.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-ui-fg-subtle text-sm">No pages available</p>
              )}
            </section>
          </div>

          {/* XML Sitemap Link */}
          <div className="mt-12 pt-8 border-t border-ui-border-base">
            <p className="text-ui-fg-subtle text-sm mb-2">
              For search engines, visit our{" "}
              <Link
                href="/sitemap.xml"
                className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover hover:underline"
              >
                XML Sitemap
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
