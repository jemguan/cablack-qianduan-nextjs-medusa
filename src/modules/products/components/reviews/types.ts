import type { HttpTypes } from "@medusajs/types"

/**
 * 评论类型
 */
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

/**
 * 管理员回复类型
 */
export interface ReviewResponse {
  id: string
  review_id: string
  admin_user_id: string
  content: string
  created_at: string
}

/**
 * 投票类型
 */
export interface ReviewVote {
  id: string
  review_id: string
  customer_id?: string | null
  is_helpful: boolean
}

/**
 * 评论统计类型
 */
export interface ReviewStats {
  total: number
  average_rating: number
  rating_distribution: { [key: number]: number }
  pending_count: number
  approved_count: number
}

/**
 * Reviews Block 配置数据
 */
export interface ReviewsData {
  enabled: boolean
  title?: string
  subtitle?: string
  showTitle?: boolean
  showSubtitle?: boolean
  titleAlign?: "left" | "center" | "right"
  showStats?: boolean
  showForm?: boolean
  showOnDesktop?: boolean
  showOnMobile?: boolean
  limit?: number
  defaultSort?: "newest" | "helpful" | "rating"
  allowAnonymous?: boolean
  requireVerifiedPurchase?: boolean
}

/**
 * Reviews Block Props
 */
export interface ReviewsBlockProps {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  config?: ReviewsData
}

/**
 * Reviews 组件 Props
 */
export interface ReviewsProps {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  config: ReviewsData
}

