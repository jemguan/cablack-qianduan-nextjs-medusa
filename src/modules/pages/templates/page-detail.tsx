import { PageData } from "@lib/data/pages"
import Link from "next/link"
import { getImageUrl } from "@lib/util/image"
import { sanitizeHtml } from "@lib/util/sanitize"

export default function PageDetailTemplate({
  page,
}: {
  page: PageData
}) {
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

  // Process images and sanitize HTML content for XSS protection
  const processedContent = sanitizeHtml(processContentImages(page.content))

  return (
    <div className="content-container py-12">
      {/* Page content */}
      <article className="max-w-7xl mx-auto">
        {/* Title and Subtitle */}
        <header className="mb-8">
          <h1 className="text-3xl-semi mb-4 text-ui-fg-base">{page.title}</h1>
          {page.subtitle && (
            <p className="text-xl text-ui-fg-subtle">{page.subtitle}</p>
          )}
        </header>

        {/* Page content */}
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

        {/* Back to home */}
        <div className="mt-12 pt-8 border-t border-ui-border-base">
          <Link
            href="/"
            className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-colors inline-flex items-center gap-2"
          >
            ← Back to Home
          </Link>
        </div>
      </article>
    </div>
  )
}

