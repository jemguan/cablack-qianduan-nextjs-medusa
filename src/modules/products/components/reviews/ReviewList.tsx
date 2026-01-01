"use client"

import { useState } from "react"
import { Text, Button, clx } from "@medusajs/ui"
import type { Review } from "./types"
import ReviewItem from "./ReviewItem"

interface ReviewListProps {
  reviews: Review[]
  onRefresh?: () => void
  defaultSort?: "newest" | "helpful" | "rating"
}

/**
 * 评论列表组件
 * 支持排序和筛选
 */
export default function ReviewList({
  reviews,
  onRefresh,
  defaultSort = "newest",
}: ReviewListProps) {
  const [sortBy, setSortBy] = useState<"newest" | "helpful" | "rating">(
    defaultSort
  )
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)

  // 排序和筛选评论
  const sortedAndFilteredReviews = [...reviews]
    .filter((review) => {
      if (ratingFilter === null) return true
      return review.rating === ratingFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          )
        case "helpful":
          const aHelpful = a.helpful_count || 0
          const bHelpful = b.helpful_count || 0
          if (bHelpful !== aHelpful) {
            return bHelpful - aHelpful
          }
          // 如果 helpful count 相同，按时间排序
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          )
        case "rating":
          if (b.rating !== a.rating) {
            return b.rating - a.rating
          }
          // 如果评分相同，按时间排序
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          )
        default:
          return 0
      }
    })

  if (reviews.length === 0) {
    return (
      <div className="py-8 text-center">
        <Text className="text-ui-fg-subtle">
          No reviews yet. Be the first to review this product!
        </Text>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 排序和筛选控制 */}
      <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-ui-border-base">
        <div className="flex items-center gap-2">
          <Text className="text-sm font-semibold">Sort by:</Text>
          <div className="flex gap-1">
            {(["newest", "helpful", "rating"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={clx(
                  "px-3 py-1 text-xs rounded-md transition-colors",
                  sortBy === option
                    ? "bg-ui-fg-interactive text-white"
                    : "bg-ui-bg-subtle hover:bg-ui-bg-subtle-hover"
                )}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Text className="text-sm font-semibold">Filter:</Text>
          <div className="flex gap-1">
            <button
              onClick={() => setRatingFilter(null)}
              className={clx(
                "px-3 py-1 text-xs rounded-md transition-colors",
                ratingFilter === null
                  ? "bg-ui-fg-interactive text-white"
                  : "bg-ui-bg-subtle hover:bg-ui-bg-subtle-hover"
              )}
            >
              All
            </button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() =>
                  setRatingFilter(ratingFilter === rating ? null : rating)
                }
                className={clx(
                  "px-3 py-1 text-xs rounded-md transition-colors",
                  ratingFilter === rating
                    ? "bg-ui-fg-interactive text-white"
                    : "bg-ui-bg-subtle hover:bg-ui-bg-subtle-hover"
                )}
              >
                {rating}★
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 评论列表 */}
      <div className="space-y-0">
        {sortedAndFilteredReviews.length === 0 ? (
          <div className="py-8 text-center">
            <Text className="text-ui-fg-subtle">
              No reviews match your filter criteria.
            </Text>
          </div>
        ) : (
          sortedAndFilteredReviews.map((review) => (
            <ReviewItem
              key={review.id}
              review={review}
              onVoteUpdate={onRefresh}
            />
          ))
        )}
      </div>

      {/* 显示筛选结果数量 */}
      {ratingFilter !== null && (
        <Text className="text-xs text-ui-fg-subtle text-center">
          Showing {sortedAndFilteredReviews.length} of {reviews.length} reviews
        </Text>
      )}
    </div>
  )
}

