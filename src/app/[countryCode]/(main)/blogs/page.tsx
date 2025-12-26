import { Metadata } from "next"

import { listBlogs } from "@lib/data/blogs"
import BlogsListTemplate from "@modules/blogs/templates/blogs-list"
import Breadcrumb from "@modules/common/components/breadcrumb"

export const metadata: Metadata = {
  title: "Blog",
  description: "Read our latest blog articles and updates.",
}

type Params = {
  params: Promise<{
    countryCode: string
  }>
  searchParams: Promise<{
    page?: string
    search?: string
  }>
}

const BLOGS_PER_PAGE = 12

export default async function BlogsPage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams

  const page = searchParams.page ? parseInt(searchParams.page) : 1
  const search = searchParams.search || ""
  const offset = (page - 1) * BLOGS_PER_PAGE

  // 如果有搜索，获取所有文章进行前端过滤；否则使用分页
  const { posts, count } = await listBlogs(
    search
      ? { limit: "1000", offset: "0" } // 获取更多文章用于搜索
      : {
          limit: BLOGS_PER_PAGE.toString(),
          offset: offset.toString(),
        }
  )

  // 前端搜索过滤（如果后端不支持搜索）
  let filteredPosts = posts
  let filteredCount = count
  if (search) {
    const searchLower = search.toLowerCase()
    filteredPosts = posts.filter(
      (post) =>
        post.title.toLowerCase().includes(searchLower) ||
        post.meta_description?.toLowerCase().includes(searchLower) ||
        post.content?.toLowerCase().includes(searchLower)
    )
    filteredCount = filteredPosts.length
    // 应用分页到过滤后的结果
    const startIndex = offset
    const endIndex = offset + BLOGS_PER_PAGE
    filteredPosts = filteredPosts.slice(startIndex, endIndex)
  }

  const totalPages = Math.ceil(filteredCount / BLOGS_PER_PAGE)

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Blog" },
  ]

  return (
    <>
      {/* Breadcrumb container below header */}
      <div className="border-b border-ui-border-base bg-background">
        <div className="content-container py-2">
          <Breadcrumb items={breadcrumbItems} countryCode={params.countryCode} />
        </div>
      </div>

      {/* Blog list content */}
      <BlogsListTemplate
        posts={filteredPosts}
        currentPage={page}
        totalPages={totalPages}
        totalCount={filteredCount}
        search={search}
        countryCode={params.countryCode}
      />
    </>
  )
}

