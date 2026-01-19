/**
 * Reviews Block Handler
 * 用于在产品页面展示客户评论
 */

import type { HttpTypes } from "@medusajs/types"
import type { BlockBase, BlockConfig } from "./types"
import type { ReviewsData } from "../../components/reviews/types"

export function handleReviewsBlock(
  block: BlockBase,
  blockConfig: Record<string, any>,
  product: HttpTypes.StoreProduct,
  region: HttpTypes.StoreRegion
): BlockConfig | null {
  // 如果禁用，返回 null
  if (blockConfig.enabled === false) {
    return null
  }

  // 构建 ReviewsData
  const data: ReviewsData = {
    enabled: blockConfig.enabled !== false,
    title: blockConfig.title || "Customer Reviews",
    subtitle: blockConfig.subtitle || "Share your experience with this product",
    showTitle: blockConfig.showTitle !== false,
    showSubtitle: blockConfig.showSubtitle !== false,
    titleAlign: blockConfig.titleAlign || "left",
    showStats: blockConfig.showStats !== false,
    showForm: blockConfig.showForm !== false,
    showOnDesktop: blockConfig.showOnDesktop !== false,
    showOnMobile: blockConfig.showOnMobile !== false,
    limit: blockConfig.limit || 10,
    defaultSort: blockConfig.defaultSort || "newest",
    allowAnonymous: blockConfig.allowAnonymous !== false,
    requireVerifiedPurchase: blockConfig.requireVerifiedPurchase || false,
  }

  return {
    id: `reviews-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: "ReviewsBlock",
    props: {
      product,
      region,
      config: data,
    },
  }
}
