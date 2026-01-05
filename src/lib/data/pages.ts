"use server"

import { sdk } from "@lib/config"
import { getCacheConfig } from "@lib/config/cache"
import { getCacheOptions } from "./cookies"

export type PageData = {
  id: string
  title: string
  subtitle?: string | null
  content?: string | null
  url?: string | null
  meta_title?: string | null
  meta_description?: string | null
  metadata?: Record<string, any> | null
  status: string
  published_at?: string | null
  created_at: string
  updated_at: string
}

export const listPages = async (
  queryParams: Record<string, string> = {}
): Promise<{ pages: PageData[]; count: number; limit: number; offset: number }> => {
  // 获取缓存标签（用于 revalidateTag）
  const cacheOptions = await getCacheOptions("pages")
  
  // 获取缓存策略（包含 revalidate 时间）
  const cacheConfig = getCacheConfig("PAGE")

  // 合并 tags 和 revalidate 到 next 对象
  const next = {
    ...cacheOptions,
    ...(cacheConfig && 'next' in cacheConfig ? cacheConfig.next : {}),
  }

  queryParams.limit = queryParams.limit || "20"
  queryParams.offset = queryParams.offset || "0"

  try {
    const response = await sdk.client.fetch<{
      pages: PageData[]
      count: number
      limit: number
      offset: number
    }>(
      "/store/pages",
      {
        query: queryParams,
        next,
      }
    )
    return response
  } catch (error) {
    console.error("Error fetching pages:", error)
    return {
      pages: [],
      count: 0,
      limit: Number(queryParams.limit),
      offset: Number(queryParams.offset),
    }
  }
}

export const getPageByUrl = async (
  url: string
): Promise<PageData | null> => {
  // 获取缓存标签（用于 revalidateTag）
  const cacheOptions = await getCacheOptions("pages")
  
  // 获取缓存策略（包含 revalidate 时间）
  const cacheConfig = getCacheConfig("PAGE")

  // 合并 tags 和 revalidate 到 next 对象
  const next = {
    ...cacheOptions,
    ...(cacheConfig && 'next' in cacheConfig ? cacheConfig.next : {}),
  }

  try {
    const response = await sdk.client.fetch<{ page: PageData }>(
      `/store/pages/${encodeURIComponent(url)}`,
      {
        next,
      }
    )
    return response.page
  } catch (error) {
    console.error("Error fetching page by URL:", error)
    return null
  }
}

