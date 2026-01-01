"use client"

import type { ReviewStats as ReviewStatsType } from "./types"
import RatingDisplay from "./RatingDisplay"

interface ReviewStatsProps {
  stats: ReviewStatsType
  className?: string
}

/**
 * 评论统计组件
 * 显示总评论数、平均评分、评分分布
 */
export default function ReviewStats({
  stats,
  className,
}: ReviewStatsProps) {
  const { total, average_rating, rating_distribution } = stats

  if (total === 0) {
    return (
      <div className={className}>
        <p className="text-sm text-ui-fg-subtle">No reviews yet</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex flex-col gap-4">
        {/* 总评论数和平均评分 */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-3xl font-bold">{total}</span>
            <span className="text-sm text-ui-fg-subtle">Total Reviews</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <RatingDisplay rating={average_rating} size="lg" showNumber />
            </div>
            <span className="text-sm text-ui-fg-subtle">Average Rating</span>
          </div>
        </div>

        {/* 评分分布 */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Rating Distribution</h4>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = rating_distribution[rating] || 0
            const percentage = total > 0 ? (count / total) * 100 : 0

            return (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-xs w-8 text-right">{rating}★</span>
                <div className="flex-1 bg-ui-bg-subtle-hover h-2 rounded overflow-hidden">
                  <div
                    className="bg-ui-fg-interactive h-2 rounded transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs w-8 text-left text-ui-fg-subtle">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

