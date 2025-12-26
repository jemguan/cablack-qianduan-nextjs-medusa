import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getBlogByUrl } from "@lib/data/blogs"
import BlogDetailTemplate from "@modules/blogs/templates/blog-detail"
import Breadcrumb from "@modules/common/components/breadcrumb"

type Props = {
  params: Promise<{ url: string; countryCode: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const post = await getBlogByUrl(params.url)

  if (!post) {
    return {
      title: "Blog Article Not Found",
    }
  }

  const metaTitle = post.meta_title || `${post.title} | Medusa Store`
  const metaDescription =
    post.meta_description || "Read our blog articles"

  const metadata: Metadata = {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: "article",
      publishedTime: post.published_at || undefined,
      images: post.cover_image_url
        ? [
            {
              url: post.cover_image_url,
              alt: post.title,
            },
          ]
        : undefined,
    },
  }

  return metadata
}

export default async function BlogDetailPage(props: Props) {
  const params = await props.params
  const post = await getBlogByUrl(params.url)

  if (!post) {
    notFound()
  }

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blogs" },
    { label: post.title },
  ]

  return (
    <>
      {/* Breadcrumb container below header */}
      <div className="border-b border-ui-border-base bg-background">
        <div className="content-container py-2">
          <Breadcrumb items={breadcrumbItems} countryCode={params.countryCode} />
        </div>
      </div>
      
      {/* Blog content */}
      <BlogDetailTemplate post={post} countryCode={params.countryCode} />
    </>
  )
}

