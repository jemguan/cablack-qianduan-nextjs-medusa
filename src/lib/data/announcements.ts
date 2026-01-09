"use server"

import { sdk } from "@lib/config"
import { getCacheConfig } from "@lib/config/cache"
import { unstable_cache } from "next/cache"
import { cache } from "react"

export type Announcement = {
  id: string
  text: string
  link?: string | null
  is_active: boolean
  priority: number
}

/**
 * 内部获取公告列表
 */
async function fetchAnnouncementsInternal(): Promise<Announcement[]> {
  const cacheConfig = getCacheConfig("ANNOUNCEMENT")

  try {
    const response = await sdk.client.fetch<{ announcements: Announcement[] }>(
      "/store/announcements",
      {
        ...cacheConfig,
      }
    )
    return response.announcements || []
  } catch (error) {
    console.error("Error fetching announcements:", error)
    return []
  }
}

/**
 * 模块级别的 unstable_cache 实例
 * 确保在构建时缓存能够在页面之间共享
 */
const cachedAnnouncements = unstable_cache(
  fetchAnnouncementsInternal,
  ["announcements"],
  {
    revalidate: 3600, // 1小时
    tags: ["announcements"],
  }
)

/**
 * 获取公开显示的公告列表
 * 使用 React.cache 确保同一次渲染只请求一次
 * 使用 unstable_cache 确保跨请求缓存
 */
export const listAnnouncements = cache(async (): Promise<Announcement[]> => {
  return cachedAnnouncements()
})

