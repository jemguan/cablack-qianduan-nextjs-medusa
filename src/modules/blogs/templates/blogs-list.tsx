"use client"

import { BlogPost } from "@lib/data/blogs"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Pagination } from "@modules/store/components/pagination"
import { getImageUrl } from "@lib/util/image"

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

function BlogCard({ post, countryCode }: { post: BlogPost; countryCode: string }) {
  const blogUrl = post.url || post.id
  const blogLink = `/${countryCode}/blogs/${encodeURIComponent(blogUrl)}`

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return ""
    }
  }

  // Get excerpt
  const getExcerpt = () => {
    if (post.meta_description) {
      return post.meta_description
    }
    if (post.content) {
      // Remove HTML tags and truncate to first 150 characters
      const text = post.content.replace(/<[^>]*>/g, "").trim()
      return text.length > 150 ? text.substring(0, 150) + "..." : text
    }
    return ""
  }

  const coverImageUrl = getImageUrl(post.cover_image_url)

  return (
    <article className="flex flex-col h-full border border-ui-border-base rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-ui-bg-base">
      {coverImageUrl && (
        <Link href={blogLink} className="block overflow-hidden bg-ui-bg-subtle">
          <img
            src={coverImageUrl}
            alt={post.title}
            className="w-full h-auto object-contain"
          />
        </Link>
      )}
      <div className="flex-1 p-6 flex flex-col">
        <h2 className="text-xl font-semibold mb-2 text-ui-fg-base line-clamp-2">
          <Link
            href={blogLink}
            className="hover:text-ui-fg-interactive transition-colors"
          >
            {post.title}
          </Link>
        </h2>
        {getExcerpt() && (
          <p className="text-ui-fg-subtle text-sm mb-4 line-clamp-3 flex-1">
            {getExcerpt()}
          </p>
        )}
        <div className="mt-auto pt-4 border-t border-ui-border-base">
          <div className="flex items-center justify-between text-xs text-ui-fg-muted">
            <span>{formatDate(post.published_at || post.created_at)}</span>
            <Link
              href={blogLink}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover font-medium"
            >
              Read more →
            </Link>
          </div>
        </div>
      </div>
    </article>
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

