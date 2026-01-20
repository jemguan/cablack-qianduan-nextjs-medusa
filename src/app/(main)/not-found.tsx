import { Metadata } from "next"
import Link from "next/link"

import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"

export const metadata: Metadata = {
  title: "Page Not Found | 404",
  description: "The page you're looking for doesn't exist. Browse our categories and collections to find what you need.",
}

export default async function NotFound() {
  // 获取分类和集合数据
  const [categories, collectionsData] = await Promise.all([
    listCategories().catch(() => []),
    listCollections().catch(() => ({ collections: [], count: 0 })),
  ])

  // 只获取顶级分类（没有父分类的）
  const topCategories = categories
    .filter((cat) => !cat.parent_category_id)
    .slice(0, 6)

  // 获取集合
  const collections = collectionsData.collections.slice(0, 4)

  return (
    <div className="content-container py-16">
      {/* 主要错误信息 */}
      <div className="flex flex-col items-center text-center mb-16">
        <h1 className="text-6xl font-bold text-ui-fg-muted mb-4">404</h1>
        <h2 className="text-2xl-semi text-ui-fg-base mb-2">Page Not Found</h2>
        <p className="text-base text-ui-fg-subtle max-w-md mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been moved or no longer exists.
        </p>

        {/* 主要操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="px-6 py-3 bg-ui-bg-interactive text-ui-fg-on-color rounded-md hover:bg-ui-bg-interactive-hover transition-colors"
          >
            Go to Homepage
          </Link>
          <Link
            href="/store"
            className="px-6 py-3 border border-ui-border-base text-ui-fg-base rounded-md hover:bg-ui-bg-subtle transition-colors"
          >
            Browse All Products
          </Link>
        </div>
      </div>

      {/* 热门分类 */}
      {topCategories.length > 0 && (
        <div className="mb-16">
          <h3 className="text-xl font-semibold text-ui-fg-base mb-6 text-center">
            Popular Categories
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {topCategories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.handle}`}
                className="group p-4 border border-ui-border-base rounded-lg hover:border-ui-border-interactive hover:bg-ui-bg-subtle transition-all text-center"
              >
                <span className="text-sm font-medium text-ui-fg-base group-hover:text-ui-fg-interactive transition-colors">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 精选集合 */}
      {collections.length > 0 && (
        <div className="mb-16">
          <h3 className="text-xl font-semibold text-ui-fg-base mb-6 text-center">
            Featured Collections
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.handle}`}
                className="group p-6 border border-ui-border-base rounded-lg hover:border-ui-border-interactive hover:bg-ui-bg-subtle transition-all"
              >
                <h4 className="font-medium text-ui-fg-base group-hover:text-ui-fg-interactive transition-colors mb-1">
                  {collection.title}
                </h4>
                <span className="text-sm text-ui-fg-subtle">Shop now</span>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
