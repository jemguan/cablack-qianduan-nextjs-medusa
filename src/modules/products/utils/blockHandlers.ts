/**
 * Product Page Block Handlers
 * 处理产品页不同类型的 block 配置
 *
 * 此文件从 handlers 目录重新导出所有 handlers
 */

// 类型导出
export type { BlockBase, BlockConfig, ProductContentProps } from "./handlers"

// Handler 导出
export {
  handleProductContentBlock,
  handleFAQBlock,
  handleRecentlyViewedProductsBlock,
  handleBundleSaleBlock,
  handleReviewsBlock,
  handleBannerBlock,
} from "./handlers"
