"use client"

import { useState } from "react"
import { Text } from "@medusajs/ui"
import type { HttpTypes } from "@medusajs/types"
import type { ReviewsData, Review } from "./types"
import ReviewList from "./ReviewList"
import ReviewForm from "./ReviewForm"
import ReviewStats from "./ReviewStats"
import { DEFAULT_REVIEWS_CONFIG } from "./config"

interface DesktopReviewsProps {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  config: ReviewsData
  // 从父组件接收数据，避免重复请求
  reviews: Review[]
  reviewsCount: number
  isLoading: boolean
  onRefresh: () => void
}

/**
 * 桌面端评论组件
 * 数据从父组件传入，不再自己获取
 */
export default function DesktopReviews({
  product,
  region,
  config,
  reviews,
  reviewsCount,
  isLoading,
  onRefresh,
}: DesktopReviewsProps) {
  const [showForm, setShowForm] = useState(false)

  const {
    showStats = DEFAULT_REVIEWS_CONFIG.showStats,
    showForm: showFormConfig = DEFAULT_REVIEWS_CONFIG.showForm,
    defaultSort = DEFAULT_REVIEWS_CONFIG.defaultSort,
    allowAnonymous = DEFAULT_REVIEWS_CONFIG.allowAnonymous,
  } = config

  // 计算统计信息
  const stats = reviews.length > 0
    ? {
        total: reviewsCount,
        average_rating:
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
        rating_distribution: reviews.reduce(
          (acc, r) => {
            const rating = r.rating as 1 | 2 | 3 | 4 | 5
            acc[rating] = (acc[rating] || 0) + 1
            return acc
          },
          { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>
        ),
        pending_count: 0,
        approved_count: reviewsCount,
      }
    : null

  const handleFormSuccess = () => {
    setShowForm(false)
    onRefresh() // 通知父组件刷新
  }

  return (
    <div className="w-full py-8">
      {/* 统计信息 */}
      {showStats && stats && (
        <div className="mb-8 p-6 bg-ui-bg-subtle rounded-lg">
          <ReviewStats stats={stats} />
        </div>
      )}

      {/* 评论表单 */}
      {showFormConfig && (
        <div className="mb-8">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 px-4 bg-ui-bg-subtle hover:bg-ui-bg-subtle-hover rounded-md border border-ui-border-base transition-colors text-sm font-semibold"
            >
              Write a Review
            </button>
          ) : (
            <div className="p-6 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
              <ReviewForm
                product={product}
                onSuccess={handleFormSuccess}
                allowAnonymous={allowAnonymous}
              />
            </div>
          )}
        </div>
      )}

      {/* 评论列表 */}
      {isLoading ? (
        <div className="py-8 text-center">
          <Text className="text-ui-fg-subtle">Loading reviews...</Text>
        </div>
      ) : (
        <ReviewList
          reviews={reviews}
          onRefresh={onRefresh}
          defaultSort={defaultSort}
        />
      )}
    </div>
  )
}

