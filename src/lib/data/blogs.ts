"use server"

import { sdk } from "@lib/config"
import { getCacheConfig } from "@lib/config/cache"
import { getCacheOptions } from "./cookies"

export type BlogPost = {
  id: string
  title: string
  content?: string | null
  url?: string | null
  cover_image_url?: string | null
  meta_title?: string | null
  meta_description?: string | null
  status: string
  published_at?: string | null
  created_at: string
  updated_at: string
}

export const listBlogs = async (
  queryParams: Record<string, string> = {}
): Promise<{ posts: BlogPost[]; count: number; limit: number; offset: number }> => {
  // 获取缓存标签（用于 revalidateTag）
  const cacheOptions = await getCacheOptions("blogs")
  
  // 获取缓存策略（包含 revalidate 时间）
  const cacheConfig = getCacheConfig("BLOG")

  // 合并 tags 和 revalidate 到 next 对象
  const next = {
    ...cacheOptions,
    ...(cacheConfig && 'next' in cacheConfig ? cacheConfig.next : {}),
  }

  queryParams.limit = queryParams.limit || "20"
  queryParams.offset = queryParams.offset || "0"

  try {
    const response = await sdk.client.fetch<{
      posts: BlogPost[]
      count: number
      limit: number
      offset: number
    }>(
      "/store/blogs",
      {
        query: queryParams,
        next,
      }
    )
    return response
  } catch (error) {
    console.error("Error fetching blogs:", error)
    return {
      posts: [],
      count: 0,
      limit: Number(queryParams.limit),
      offset: Number(queryParams.offset),
    }
  }
}

export const getBlogByUrl = async (
  url: string
): Promise<BlogPost | null> => {
  // 获取缓存标签（用于 revalidateTag）
  const cacheOptions = await getCacheOptions("blogs")
  
  // 获取缓存策略（包含 revalidate 时间）
  const cacheConfig = getCacheConfig("BLOG")

  // 合并 tags 和 revalidate 到 next 对象
  const next = {
    ...cacheOptions,
    ...(cacheConfig && 'next' in cacheConfig ? cacheConfig.next : {}),
  }

  try {
    const response = await sdk.client.fetch<{ post: BlogPost }>(
      `/store/blogs/${encodeURIComponent(url)}`,
      {
        next,
      }
    )
    return response.post
  } catch (error) {
    console.error("Error fetching blog by URL:", error)
    return null
  }
}
