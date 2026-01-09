"use client"

import { useEffect, useContext } from "react"
import RatingDisplay from "./RatingDisplay"
import { ReviewStatsContext } from "./ReviewStatsContext"
import { Text } from "@medusajs/ui"

/**
 * 预获取的评论统计数据类型
 * 可以从服务端传递给客户端，避免客户端 API 请求
 */
export interface PreFetchedReviewStats {
  average_rating: number
  total: number
}

interface ProductRatingProps {
  productId: string
  size?: "sm" | "md" | "lg"
  showCount?: boolean
  className?: string
  /**
   * 可选的预获取统计数据
   * 如果提供，将直接使用而不触发 API 请求
   * 用于服务端渲染或已有数据的场景
   */
  prefetchedStats?: PreFetchedReviewStats | null
}

/**
 * 产品评分组件
 * 显示产品的平均评分和评论数量
 * 
 * 优化说明：
 * 1. 如果提供了 prefetchedStats，直接使用，不触发任何 API 请求
 * 2. 否则使用 ReviewStatsContext 批量获取（已优化为单个批量 API 调用）
 * 3. 如果没有 Context 且没有预获取数据，静默返回 null
 */
export default function ProductRating({
  productId,
  size = "sm",
  showCount = true,
  className,
  prefetchedStats,
}: ProductRatingProps) {
  const context = useContext(ReviewStatsContext)

  // 如果有预获取的数据，直接使用，不需要 API 请求
  if (prefetchedStats && prefetchedStats.total > 0) {
    return (
      <div className={`flex items-center gap-1.5 ${className || ""}`}>
        <RatingDisplay
          rating={prefetchedStats.average_rating}
          size={size}
          showNumber={false}
        />
        {showCount && prefetchedStats.total > 0 && (
          <Text className="text-xs text-ui-fg-subtle">
            ({prefetchedStats.total})
          </Text>
        )}
      </div>
    )
  }

  // 如果没有预获取数据，也没有 Context，静默返回
  if (!context) {
    return null
  }

  const { getStats, isLoading, prefetchStats } = context

  // 预取评论统计（批量处理）
  // prefetchStats 内部已经处理了重复请求的检查，这里直接调用即可
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    // 如果已经有缓存，不需要请求
    const cachedStats = getStats(productId)
    if (cachedStats) {
      return
    }

    // 如果正在加载，不需要再次请求
    if (isLoading(productId)) {
      return
    }

    // 预取（prefetchStats 内部会检查是否已请求）
    prefetchStats([productId])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]) // 只依赖 productId

  const stats = getStats(productId)
  const loading = isLoading(productId)

  // 加载中或不显示
  if (loading || !stats || stats.total === 0) {
    return null
  }

  return (
    <div className={`flex items-center gap-1.5 ${className || ""}`}>
      <RatingDisplay
        rating={stats.average_rating}
        size={size}
        showNumber={false}
      />
      {showCount && stats.total > 0 && (
        <Text className="text-xs text-ui-fg-subtle">
          ({stats.total})
        </Text>
      )}
    </div>
  )
}

