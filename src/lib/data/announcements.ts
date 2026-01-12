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
 * 使用更长的 revalidate 时间以减少构建时的请求
 */
const cachedAnnouncements = unstable_cache(
  fetchAnnouncementsInternal,
  ["announcements-global"],
  {
    revalidate: 7200, // 2小时，减少构建时的请求频率
    tags: ["announcements"],
  }
)

// 全局缓存变量，用于在构建时跨请求共享数据
let globalAnnouncementsCache: Announcement[] | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 7200000 // 2小时（毫秒）

/**
 * 获取公开显示的公告列表
 * 使用多层缓存策略：
 * 1. 内存缓存（构建时跨请求共享）
 * 2. React.cache（同一次渲染只请求一次）
 * 3. unstable_cache（Next.js 数据缓存）
 */
export const listAnnouncements = cache(async (): Promise<Announcement[]> => {
  // 检查内存缓存（构建时有效）
  const now = Date.now()
  if (globalAnnouncementsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return globalAnnouncementsCache
  }

  // 使用 unstable_cache
  const result = await cachedAnnouncements()
  
  // 更新内存缓存
  globalAnnouncementsCache = result
  cacheTimestamp = now
  
  return result
})

