/**
 * RecentlyViewedProducts Block Handler
 * 用于在产品页面展示最近浏览的产品
 */

import type { HttpTypes } from "@medusajs/types"
import type { BlockBase, BlockConfig } from "./types"
import type { RecentlyViewedProductsData } from "../../components/recently-viewed-products/types"

export function handleRecentlyViewedProductsBlock(
  block: BlockBase,
  blockConfig: Record<string, any>,
  product: HttpTypes.StoreProduct,
  region: HttpTypes.StoreRegion,
  countryCode?: string
): BlockConfig | null {
  // 如果禁用，返回 null
  if (blockConfig.enabled === false) {
    return null
  }

  // 构建 RecentlyViewedProductsData
  const data: RecentlyViewedProductsData = {
    enabled: blockConfig.enabled !== false,
    limit: blockConfig.limit || 8,
    currentProductId: product.id,
    layout: blockConfig.layout || "grid",
    desktopCols: blockConfig.desktopCols || 3,
    desktopMaxCount: blockConfig.desktopMaxCount || 6,
    desktopEnableCarousel: blockConfig.desktopEnableCarousel || false,
    desktopCarouselLoop: blockConfig.desktopCarouselLoop || false,
    desktopCarouselAutoplay: blockConfig.desktopCarouselAutoplay || false,
    desktopCarouselAutoplayDelay:
      blockConfig.desktopCarouselAutoplayDelay || 3000,
    desktopCarouselSpacing: blockConfig.desktopCarouselSpacing || 24,
    desktopCarouselShowNavigation:
      blockConfig.desktopCarouselShowNavigation !== false,
    desktopCarouselShowPagination:
      blockConfig.desktopCarouselShowPagination !== false,
    desktopCarouselAlign: blockConfig.desktopCarouselAlign || "start",
    desktopCarouselDraggable: blockConfig.desktopCarouselDraggable !== false,
    mobileLayout: blockConfig.mobileLayout || "carousel",
    mobileCols: blockConfig.mobileCols || 2,
    mobileCarouselSlidesPerView:
      blockConfig.mobileCarouselSlidesPerView || 1.5,
    mobileCarouselLoop: blockConfig.mobileCarouselLoop || false,
    mobileCarouselAutoplay: blockConfig.mobileCarouselAutoplay || false,
    mobileCarouselAutoplayDelay:
      blockConfig.mobileCarouselAutoplayDelay || 3000,
    mobileCarouselSpacing: blockConfig.mobileCarouselSpacing || 16,
    mobileCarouselShowNavigation:
      blockConfig.mobileCarouselShowNavigation || false,
    mobileCarouselShowPagination:
      blockConfig.mobileCarouselShowPagination !== false,
    mobileCarouselAlign: blockConfig.mobileCarouselAlign || "start",
    mobileCarouselDraggable: blockConfig.mobileCarouselDraggable !== false,
    title: blockConfig.title || "Recently Viewed",
    subtitle: blockConfig.subtitle || "Products you viewed recently",
    showTitle: blockConfig.showTitle !== false,
    showSubtitle: blockConfig.showSubtitle !== false,
    titleAlign: blockConfig.titleAlign || "left",
  }

  return {
    id: `recently-viewed-products-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: "RecentlyViewedProductsBlock",
    props: {
      data,
      region,
      countryCode,
    },
  }
}
