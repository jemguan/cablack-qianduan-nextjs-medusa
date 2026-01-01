import type { ReviewsData } from "./types"

/**
 * Reviews Block 默认配置
 */
export const DEFAULT_REVIEWS_CONFIG: Required<ReviewsData> = {
  enabled: true,
  title: "Customer Reviews",
  subtitle: "Share your experience with this product",
  showTitle: true,
  showSubtitle: true,
  titleAlign: "left",
  showStats: true,
  showForm: true,
  showOnDesktop: true,
  showOnMobile: true,
  limit: 10,
  defaultSort: "newest",
  allowAnonymous: true,
  requireVerifiedPurchase: false,
}

