"use client"

import { BlogPost } from "@lib/data/blogs"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Pagination } from "@modules/store/components/pagination"
import { BlogCard } from "@modules/blogs/components/blog-card"

function BlogSearchBox({
  initialSearch,
  countryCode,
}: {
  initialSearch: string
  countryCode: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(initialSearch)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim())
      params.delete("page") // Reset to first page
    } else {
      params.delete("search")
      params.delete("page")
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="mb-8">
      <div className="flex gap-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search blogs..."
          className="flex-1 px-4 py-2 border border-ui-border-base rounded-md focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive focus:border-transparent bg-ui-bg-base text-ui-fg-base"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-ui-bg-interactive text-ui-fg-on-color rounded-md hover:bg-ui-bg-interactive-hover transition-colors"
        >
          Search
        </button>
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("")
              const params = new URLSearchParams(searchParams)
              params.delete("search")
              params.delete("page")
              router.push(`${pathname}?${params.toString()}`)
            }}
            className="px-4 py-2 text-ui-fg-subtle hover:text-ui-fg-base transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  )
}

export default function BlogsListTemplate({
  posts,
  currentPage,
  totalPages,
  totalCount,
  search,
  countryCode,
}: {
  posts: BlogPost[]
  currentPage: number
  totalPages: number
  totalCount: number
  search: string
  countryCode: string
}) {
  return (
    <div className="content-container py-12">
      <div className="mb-8">
        <h1 className="text-2xl-semi mb-2">Blog</h1>
        <p className="text-ui-fg-subtle">
          {search
            ? `Found ${totalCount} article${totalCount !== 1 ? "s" : ""}`
            : `${totalCount} article${totalCount !== 1 ? "s" : ""}`}
        </p>
      </div>

      <BlogSearchBox initialSearch={search} countryCode={countryCode} />

      {posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-ui-fg-subtle text-lg mb-2">
            {search ? "No articles found" : "No blog articles yet"}
          </p>
          {search && (
            <p className="text-ui-fg-muted text-sm">
              Try searching with different keywords
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 medium:grid-cols-2 large:grid-cols-3 gap-6 mb-12">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} countryCode={countryCode} />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination page={currentPage} totalPages={totalPages} />
          )}
        </>
      )}
    </div>
  )
}

