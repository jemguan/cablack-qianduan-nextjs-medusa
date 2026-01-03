import { BlogPost } from "@lib/data/blogs"
import Link from "next/link"
import { getImageUrl } from "@lib/util/image"

export default function BlogDetailTemplate({
  post,
  countryCode, // No longer used, kept for backward compatibility
}: {
  post: BlogPost
  countryCode?: string
}) {
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

  // Process image URLs in content
  const processContentImages = (html: string | null | undefined): string => {
    if (!html) return ""
    
    // Use regex to match img tags and their src attributes
    return html.replace(
      /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
      (match, beforeSrc, src, afterSrc) => {
        const fullImageUrl = getImageUrl(src) || src
        return `<img${beforeSrc}src="${fullImageUrl}"${afterSrc}>`
      }
    )
  }

  const publishedDate = formatDate(post.published_at || post.created_at)
  const processedContent = processContentImages(post.content)

  return (
    <div className="content-container py-12">
      {/* Blog content */}
      <article className="max-w-7xl mx-auto">
        {/* Title */}
        <header className="mb-8">
          <h1 className="text-3xl-semi mb-4 text-ui-fg-base">{post.title}</h1>
          {publishedDate && (
            <div className="text-ui-fg-subtle text-sm">
              <time dateTime={post.published_at || post.created_at}>
                {publishedDate}
              </time>
            </div>
          )}
        </header>

        {/* Blog content */}
        {processedContent && (
          <div
            className="prose prose-lg max-w-none dark:prose-invert
              prose-headings:text-ui-fg-base
              prose-p:text-ui-fg-base
              prose-a:text-ui-fg-interactive prose-a:no-underline hover:prose-a:underline
              prose-strong:text-ui-fg-base
              prose-code:text-ui-fg-base prose-code:bg-ui-bg-subtle prose-code:px-1 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-ui-bg-subtle prose-pre:text-ui-fg-base
              prose-img:rounded-lg prose-img:my-8
              prose-blockquote:border-l-ui-border-base prose-blockquote:text-ui-fg-subtle
              prose-ul:text-ui-fg-base prose-ol:text-ui-fg-base
              prose-li:text-ui-fg-base
              prose-hr:border-ui-border-base"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        )}

        {/* Back to blog list */}
        <div className="mt-12 pt-8 border-t border-ui-border-base">
          <Link
            href="/blogs"
            className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-colors inline-flex items-center gap-2"
          >
            ← Back to Blog
          </Link>
        </div>
      </article>
    </div>
  )
}
