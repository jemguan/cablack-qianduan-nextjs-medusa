import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getBlogByUrl } from "@lib/data/blogs"
import { getCountryCode } from "@lib/data/regions"
import BlogDetailTemplate from "@modules/blogs/templates/blog-detail"
import Breadcrumb from "@modules/common/components/breadcrumb"

// 设置页面级别的 revalidate 为 5 分钟（300 秒），确保缓存及时更新
export const revalidate = 300

type Props = {
  params: Promise<{ url: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const post = await getBlogByUrl(params.url)

  if (!post) {
    return {
      title: "Blog Article Not Found",
    }
  }

  const metaTitle = post.meta_title || `${post.title} | Onahole Station`
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
  const countryCode = await getCountryCode()
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
          <Breadcrumb items={breadcrumbItems} countryCode={countryCode} />
        </div>
      </div>
      
      {/* Blog content */}
      <BlogDetailTemplate post={post} countryCode={countryCode} />
    </>
  )
}
