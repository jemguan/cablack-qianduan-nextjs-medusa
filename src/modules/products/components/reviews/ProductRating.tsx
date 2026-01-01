"use client"

import { useEffect, useContext } from "react"
import RatingDisplay from "./RatingDisplay"
import { ReviewStatsContext } from "./ReviewStatsContext"
import { Text } from "@medusajs/ui"

interface ProductRatingProps {
  productId: string
  size?: "sm" | "md" | "lg"
  showCount?: boolean
  className?: string
}

/**
 * 产品评分组件
 * 显示产品的平均评分和评论数量
 * 使用 ReviewStatsContext 来避免重复 API 调用
 */
export default function ProductRating({
  productId,
  size = "sm",
  showCount = true,
  className,
}: ProductRatingProps) {
  const context = useContext(ReviewStatsContext)

  // 如果没有 Context，静默返回（向后兼容）
  if (!context) {
    return null
  }

  const { getStats, isLoading, prefetchStats } = context

  // 预取评论统计（批量处理）
  // prefetchStats 内部已经处理了重复请求的检查，这里直接调用即可
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

