"use client"

import { useState, useEffect, useCallback } from "react"
import { Text } from "@medusajs/ui"
import type { HttpTypes } from "@medusajs/types"
import { getReviews } from "@lib/data/reviews"
import type { ReviewsData, Review } from "./types"
import ReviewList from "./ReviewList"
import ReviewForm from "./ReviewForm"
import ReviewStats from "./ReviewStats"
import { DEFAULT_REVIEWS_CONFIG } from "./config"

interface MobileReviewsProps {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  config: ReviewsData
}

/**
 * 移动端评论组件
 */
export default function MobileReviews({
  product,
  region,
  config,
}: MobileReviewsProps) {
  const [showForm, setShowForm] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsCount, setReviewsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const {
    showStats = DEFAULT_REVIEWS_CONFIG.showStats,
    showForm: showFormConfig = DEFAULT_REVIEWS_CONFIG.showForm,
    limit = DEFAULT_REVIEWS_CONFIG.limit,
    defaultSort = DEFAULT_REVIEWS_CONFIG.defaultSort,
    allowAnonymous = DEFAULT_REVIEWS_CONFIG.allowAnonymous,
  } = config

  // 加载评论列表
  const loadReviews = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getReviews({
        product_id: product.id,
        status: "approved",
        limit,
        offset: 0,
        order_by: "created_at",
        order: "DESC",
      })
      setReviews(result.reviews || [])
      setReviewsCount(result.count || 0)
    } catch (error) {
      console.error("Failed to load reviews:", error)
      setReviews([])
      setReviewsCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [product.id, limit])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  // 计算统计信息
  const stats = reviews.length > 0
    ? {
        total: reviewsCount,
        average_rating:
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
        rating_distribution: reviews.reduce(
          (acc, r) => {
            acc[r.rating] = (acc[r.rating] || 0) + 1
            return acc
          },
          { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        ),
        pending_count: 0,
        approved_count: reviewsCount,
      }
    : null

  const handleFormSuccess = () => {
    setShowForm(false)
    loadReviews()
  }

  return (
    <div className="w-full py-6">
      {/* 统计信息 */}
      {showStats && stats && (
        <div className="mb-6 p-4 bg-ui-bg-subtle rounded-lg">
          <ReviewStats stats={stats} />
        </div>
      )}

      {/* 评论表单 */}
      {showFormConfig && (
        <div className="mb-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-2.5 px-4 bg-ui-bg-subtle hover:bg-ui-bg-subtle-hover rounded-md border border-ui-border-base transition-colors text-sm font-semibold"
            >
              Write a Review
            </button>
          ) : (
            <div className="p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
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
        <div className="py-6 text-center">
          <Text className="text-sm text-ui-fg-subtle">Loading reviews...</Text>
        </div>
      ) : (
        <ReviewList
          reviews={reviews}
          onRefresh={loadReviews}
          defaultSort={defaultSort}
        />
      )}
    </div>
  )
}

