"use server"

import { sdk } from "@lib/config"
import { getCacheConfig } from "@lib/config/cache"
import { getCacheOptions } from "./cookies"

export type Announcement = {
  id: string
  text: string
  link?: string | null
  is_active: boolean
  priority: number
}

/**
 * 获取公开显示的公告列表
 */
export const listAnnouncements = async (): Promise<Announcement[]> => {
  // 获取缓存标签
  const cacheOptions = await getCacheOptions("announcements")
  
  // 获取缓存策略
  const cacheConfig = getCacheConfig("ANNOUNCEMENT")

  const next = {
    ...cacheOptions,
    ...(cacheConfig && 'next' in cacheConfig ? cacheConfig.next : {}),
  }

  try {
    const response = await sdk.client.fetch<{ announcements: Announcement[] }>(
      "/store/announcements",
      {
        next,
      }
    )
    return response.announcements || []
  } catch (error) {
    console.error("Error fetching announcements:", error)
    return []
  }
}

