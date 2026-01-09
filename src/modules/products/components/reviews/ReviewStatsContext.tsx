"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { getReviews } from "@lib/data/reviews"

interface ReviewStats {
  average_rating: number
  total: number
}

interface ReviewStatsContextType {
  getStats: (productId: string) => ReviewStats | null
  isLoading: (productId: string) => boolean
  prefetchStats: (productIds: string[]) => void
}

export const ReviewStatsContext = createContext<ReviewStatsContextType | null>(null)

// 缓存最大条目数，防止内存无限增长
const MAX_CACHE_SIZE = 200
// 已请求 Set 最大大小
const MAX_REQUESTED_SIZE = 500

/**
 * 评论统计 Context Provider
 * 用于批量获取和缓存产品评论统计，避免重复 API 调用
 */
export function ReviewStatsProvider({ children }: { children: React.ReactNode }) {
  const [statsCache, setStatsCache] = useState<Record<string, ReviewStats>>({})
  const [loadingSet, setLoadingSet] = useState<Set<string>>(new Set())
  const pendingRequestsRef = useRef<Map<string, Promise<void>>>(new Map())
  const batchQueueRef = useRef<Set<string>>(new Set())
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null)
  // 使用 ref 存储最新的缓存和加载状态，避免 useCallback 依赖问题
  const statsCacheRef = useRef<Record<string, ReviewStats>>({})
  const loadingSetRef = useRef<Set<string>>(new Set())
  // 全局跟踪已请求的产品 ID（包括已缓存和正在加载的），避免重复请求
  const requestedProductsRef = useRef<Set<string>>(new Set())

  // 同步 ref 和 state
  useEffect(() => {
    statsCacheRef.current = statsCache
  }, [statsCache])

  useEffect(() => {
    loadingSetRef.current = loadingSet
  }, [loadingSet])
  
  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current)
      }
      // 清理所有 refs 防止内存泄漏
      pendingRequestsRef.current.clear()
      batchQueueRef.current.clear()
      requestedProductsRef.current.clear()
    }
  }, [])

  // 批量获取评论统计
  const batchFetchStats = useCallback(async (productIds: string[]) => {
    if (productIds.length === 0) return

    // 使用 ref 来检查，避免依赖 state 导致函数重新创建
    const idsToFetch = productIds.filter(
      (id) => 
        !statsCacheRef.current[id] && 
        !loadingSetRef.current.has(id) && 
        !pendingRequestsRef.current.has(id)
    )

    if (idsToFetch.length === 0) return

    // 标记为加载中
    setLoadingSet((prev) => {
      const next = new Set(prev)
      idsToFetch.forEach((id) => next.add(id))
      return next
    })

    // 创建请求 Promise
    const requestPromise = (async () => {
      try {
        // 批量获取评论统计
        const fetchPromises = idsToFetch.map(async (productId) => {
          try {
            const result = await getReviews({
              product_id: productId,
              status: "approved",
              limit: 100, // 只需要少量评论来计算平均分
              offset: 0,
            })

            if (result.reviews && result.reviews.length > 0) {
              const total = result.count || result.reviews.length
              const averageRating =
                result.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
                result.reviews.length

              return {
                productId,
                stats: {
                  average_rating: averageRating,
                  total,
                },
              }
            }
            return null
          } catch (error) {
            console.error(`Failed to load review stats for product ${productId}:`, error)
            return null
          }
        })

        const results = await Promise.all(fetchPromises)

        // 更新缓存，同时限制缓存大小防止内存泄漏
        setStatsCache((prev) => {
          const next = { ...prev }
          results.forEach((result) => {
            if (result) {
              next[result.productId] = result.stats
            }
          })
          
          // 如果缓存超过最大大小，删除最早的条目
          const keys = Object.keys(next)
          if (keys.length > MAX_CACHE_SIZE) {
            const keysToRemove = keys.slice(0, keys.length - MAX_CACHE_SIZE)
            keysToRemove.forEach((key) => {
              delete next[key]
              // 同时从 requestedProductsRef 中移除，允许重新请求
              requestedProductsRef.current.delete(key)
            })
          }
          
          return next
        })
      } catch (error) {
        console.error("Failed to batch fetch review stats:", error)
      } finally {
        // 移除加载中标记和请求记录
        setLoadingSet((prev) => {
          const next = new Set(prev)
          idsToFetch.forEach((id) => next.delete(id))
          return next
        })
        idsToFetch.forEach((id) => pendingRequestsRef.current.delete(id))
      }
    })()

    // 记录请求
    idsToFetch.forEach((id) => {
      pendingRequestsRef.current.set(id, requestPromise)
    })
  }, []) // 不依赖任何 state，使用 ref 来访问最新值

  // 预取评论统计（批量处理，延迟执行）
  const prefetchStats = useCallback(
    (productIds: string[]) => {
      // 使用 ref 来检查缓存和已请求状态，避免依赖 state
      const idsToQueue = productIds.filter((id) => {
        // 如果已有缓存，标记为已请求并跳过
        if (statsCacheRef.current[id]) {
          requestedProductsRef.current.add(id)
          return false
        }
        // 如果已经请求过（包括正在加载或已在队列中），跳过
        if (requestedProductsRef.current.has(id)) {
          return false
        }
        return true
      })
      
      if (idsToQueue.length === 0) {
        return // 所有产品都有缓存或已请求，不需要请求
      }

      // 标记为已请求
      idsToQueue.forEach((id) => {
        requestedProductsRef.current.add(id)
      })
      
      // 如果 requestedProductsRef 超过最大大小，清理旧条目
      if (requestedProductsRef.current.size > MAX_REQUESTED_SIZE) {
        const entries = Array.from(requestedProductsRef.current)
        const entriesToRemove = entries.slice(0, entries.length - MAX_REQUESTED_SIZE)
        entriesToRemove.forEach((id) => {
          requestedProductsRef.current.delete(id)
        })
      }

      // 添加到队列（只添加没有缓存的）
      idsToQueue.forEach((id) => {
        // 检查是否已经在队列中或正在加载
        if (!batchQueueRef.current.has(id) && !loadingSetRef.current.has(id) && !pendingRequestsRef.current.has(id)) {
          batchQueueRef.current.add(id)
        }
      })

      // 清除之前的定时器
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current)
      }

      // 延迟执行批量获取（防抖）
      batchTimerRef.current = setTimeout(() => {
        const idsToFetch = Array.from(batchQueueRef.current)
        batchQueueRef.current.clear()
        if (idsToFetch.length > 0) {
          batchFetchStats(idsToFetch)
        }
      }, 100) // 100ms 延迟，收集所有请求
    },
    [batchFetchStats] // 只依赖 batchFetchStats，它本身是稳定的
  )

  // 获取单个产品的统计
  const getStats = useCallback(
    (productId: string): ReviewStats | null => {
      return statsCache[productId] || null
    },
    [statsCache]
  )

  // 检查是否正在加载
  const isLoading = useCallback(
    (productId: string): boolean => {
      return loadingSet.has(productId)
    },
    [loadingSet]
  )

  return (
    <ReviewStatsContext.Provider
      value={{
        getStats,
        isLoading,
        prefetchStats,
      }}
    >
      {children}
    </ReviewStatsContext.Provider>
  )
}

/**
 * 使用评论统计的 Hook
 */
export function useReviewStats() {
  const context = useContext(ReviewStatsContext)
  if (!context) {
    throw new Error("useReviewStats must be used within ReviewStatsProvider")
  }
  return context
}

