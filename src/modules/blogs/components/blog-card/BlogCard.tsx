"use client"

import { BlogPost } from "@lib/data/blogs"
import Link from "next/link"
import { getImageUrl } from "@lib/util/image"

interface BlogCardProps {
  post: BlogPost
  countryCode?: string // No longer used, kept for backward compatibility
}

export function BlogCard({ post }: BlogCardProps) {
  const blogUrl = post.url || post.id
  const blogLink = `/blogs/${encodeURIComponent(blogUrl)}`

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
