"use server"

import { sdk } from "@lib/config"
import { getCacheConfig } from "@lib/config/cache"
import medusaError from "@lib/util/medusa-error"
import { getAuthHeaders, getCacheOptions } from "./cookies"

export interface Review {
  id: string
  product_id: string
  variant_id?: string | null
  customer_id?: string | null
  rating: number
  title?: string | null
  content: string
  status: string
  images?: string[] | null
  email?: string | null
  display_name?: string | null
  verified_purchase: boolean
  created_at: string
  updated_at?: string
  helpful_count?: number
  responses?: ReviewResponse[]
}

export interface ReviewResponse {
  id: string
  review_id: string
  admin_user_id: string
  content: string
  created_at: string
}

export interface ReviewVote {
  id: string
  review_id: string
  customer_id?: string | null
  is_helpful: boolean
}

export interface ReviewsResponse {
  reviews: Review[]
  count: number
  limit: number
  offset: number
}

export interface ReviewStats {
  total: number
  average_rating: number
  rating_distribution: { [key: number]: number }
  pending_count: number
  approved_count: number
}

export interface CreateReviewData {
  product_id: string
  variant_id?: string
  rating: number
  title?: string
  content: string
  images?: string[]
  email?: string
  display_name?: string
  verified_purchase?: boolean
}

/**
 * 获取评论列表
 */
export async function getReviews(params?: {
  product_id?: string
  variant_id?: string
  status?: string
  limit?: number
  offset?: number
  order_by?: string
  order?: "ASC" | "DESC"
}): Promise<ReviewsResponse> {
  const {
    product_id,
    variant_id,
    status = "approved", // Store API 默认只显示已审核的评论
    limit = 20,
    offset = 0,
    order_by = "created_at",
    order = "DESC",
  } = params || {}

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("reviews")),
  }

  const cacheConfig = getCacheConfig("REVIEW")

  const query: Record<string, string> = {
    limit: limit.toString(),
    offset: offset.toString(),
    order_by,
    order,
  }

  if (product_id) query.product_id = product_id
  if (variant_id) query.variant_id = variant_id
  if (status) query.status = status

  return await sdk.client
    .fetch<ReviewsResponse>(`/store/reviews`, {
      method: "GET",
      query,
      headers,
      next,
      ...cacheConfig,
    })
    .catch((err) => medusaError(err))
}

/**
 * 获取单个评论详情
 */
export async function getReview(reviewId: string): Promise<Review | null> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("reviews")),
  }

  const cacheConfig = getCacheConfig("REVIEW")

  return await sdk.client
    .fetch<{ review: Review }>(`/store/reviews/${reviewId}`, {
      method: "GET",
      headers,
      next,
      ...cacheConfig,
    })
    .then(({ review }) => review)
    .catch(() => null)
}

/**
 * 创建评论
 */
export async function createReview(
  data: CreateReviewData
): Promise<{ review: Review }> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return await sdk.client
    .fetch<{ review: Review }>(`/store/reviews`, {
      method: "POST",
      body: data,
      headers,
    })
    .catch((err) => medusaError(err))
}

/**
 * 投票（有用/无用）
 */
export async function voteReview(
  reviewId: string,
  isHelpful: boolean
): Promise<{ vote: ReviewVote }> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return await sdk.client
    .fetch<{ vote: ReviewVote }>(`/store/reviews/${reviewId}/vote`, {
      method: "POST",
      body: { is_helpful: isHelpful },
      headers,
    })
    .catch((err) => medusaError(err))
}

/**
 * 获取评论统计信息
 * 注意：这个功能需要后端支持，如果没有专门的统计端点，可以从评论列表计算
 */
export async function getReviewStats(
  productId: string
): Promise<ReviewStats | null> {
  try {
    // 获取所有评论来计算统计信息
    // 使用较小的 limit 避免传输大量数据
    const allReviews = await getReviews({
      product_id: productId,
      status: "approved", // 只获取已审核的评论用于统计
      limit: 100, // 降低 limit，减少数据传输
      offset: 0,
    })

    const stats: ReviewStats = {
      total: allReviews.count,
      average_rating: 0,
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      pending_count: 0,
      approved_count: allReviews.count,
    }

    if (allReviews.reviews.length === 0) {
      return stats
    }

    let totalRating = 0
    allReviews.reviews.forEach((review) => {
      const rating = review.rating || 0
      totalRating += rating
      if (rating >= 1 && rating <= 5) {
        stats.rating_distribution[rating] =
          (stats.rating_distribution[rating] || 0) + 1
      }
    })

    stats.average_rating = totalRating / allReviews.reviews.length

    return stats
  } catch (error) {
    console.error("Failed to get review stats:", error)
    return null
  }
}

/**
 * 批量获取产品评论统计的响应类型
 */
export interface BatchReviewStatsItem {
  product_id: string
  average_rating: number
  total: number
  approved_count: number
}

export interface BatchReviewStatsResponse {
  stats: BatchReviewStatsItem[]
}

/**
 * 批量获取多个产品的评论统计
 * 使用专用的批量 API，一次请求获取多个产品的统计
 * 大幅减少 API 调用次数，提升性能
 */
export async function getBatchReviewStats(
  productIds: string[]
): Promise<BatchReviewStatsResponse> {
  if (productIds.length === 0) {
    return { stats: [] }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("reviews")),
  }

  const cacheConfig = getCacheConfig("REVIEW")

  // 使用逗号分隔的 product_ids 参数
  const query: Record<string, string> = {
    product_ids: productIds.join(","),
  }

  return await sdk.client
    .fetch<BatchReviewStatsResponse>(`/store/reviews/batch-stats`, {
      method: "GET",
      query,
      headers,
      next,
      ...cacheConfig,
    })
    .catch((err) => {
      console.error("Failed to fetch batch review stats:", err)
      // 返回空结果而不是抛出错误，避免影响页面渲染
      return { stats: [] }
    })
}

