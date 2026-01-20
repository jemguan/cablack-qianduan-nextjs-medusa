import { ArrowUpRightMini } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Page Not Found | 404",
  description: "The page you're looking for doesn't exist.",
}

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4">
      {/* 主要错误信息 */}
      <div className="flex flex-col items-center text-center max-w-lg">
        <h1 className="text-6xl font-bold text-ui-fg-muted mb-4">404</h1>
        <h2 className="text-2xl-semi text-ui-fg-base mb-2">Page Not Found</h2>
        <p className="text-base text-ui-fg-subtle mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been moved or no longer exists.
        </p>

        {/* 主要操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Link
            href="/"
            className="px-6 py-3 bg-ui-bg-interactive text-ui-fg-on-color rounded-md hover:bg-ui-bg-interactive-hover transition-colors text-center"
          >
            Go to Homepage
          </Link>
          <Link
            href="/store"
            className="px-6 py-3 border border-ui-border-base text-ui-fg-base rounded-md hover:bg-ui-bg-subtle transition-colors text-center"
          >
            Browse All Products
          </Link>
        </div>

        {/* 快速链接 */}
        <div className="border-t border-ui-border-base pt-8 w-full">
          <p className="text-sm text-ui-fg-subtle mb-4">Quick Links</p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link
              className="flex gap-x-1 items-center group"
              href="/categories"
            >
              <Text className="text-ui-fg-interactive text-sm">Categories</Text>
              <ArrowUpRightMini
                className="group-hover:rotate-45 ease-in-out duration-150"
                color="var(--fg-interactive)"
              />
            </Link>
            <Link
              className="flex gap-x-1 items-center group"
              href="/collections"
            >
              <Text className="text-ui-fg-interactive text-sm">Collections</Text>
              <ArrowUpRightMini
                className="group-hover:rotate-45 ease-in-out duration-150"
                color="var(--fg-interactive)"
              />
            </Link>
            <Link
              className="flex gap-x-1 items-center group"
              href="/contact"
            >
              <Text className="text-ui-fg-interactive text-sm">Contact Us</Text>
              <ArrowUpRightMini
                className="group-hover:rotate-45 ease-in-out duration-150"
                color="var(--fg-interactive)"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
