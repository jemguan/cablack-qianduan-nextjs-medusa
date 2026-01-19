/**
 * BundleSale Block Handler
 * 用于在产品页面展示捆绑销售
 */

import type { HttpTypes } from "@medusajs/types"
import type { BlockBase, BlockConfig } from "./types"
import type { BundleSaleData } from "../../components/bundle-sale/types"

export function handleBundleSaleBlock(
  block: BlockBase,
  blockConfig: Record<string, any>,
  product: HttpTypes.StoreProduct,
  region: HttpTypes.StoreRegion
): BlockConfig | null {
  // 如果禁用，返回 null
  if (blockConfig.enabled === false) {
    return null
  }

  // 构建 BundleSaleData
  const data: BundleSaleData = {
    enabled: blockConfig.enabled !== false,
    title: blockConfig.title || "Bundle Deals",
    subtitle: blockConfig.subtitle || "Save more when you buy together",
    showTitle: blockConfig.showTitle !== false,
    showSubtitle: blockConfig.showSubtitle !== false,
    titleAlign: blockConfig.titleAlign || "left",
    maxItems: blockConfig.maxItems || 4,
    showProducts: blockConfig.showProducts !== false,
    maxProducts: blockConfig.maxProducts || 4,
    showOnDesktop: blockConfig.showOnDesktop !== false,
    showOnMobile: blockConfig.showOnMobile !== false,
    ctaText: blockConfig.ctaText || "Buy Together & Save",
    showDiscountBadge: blockConfig.showDiscountBadge !== false,
    desktopBundleCols: blockConfig.desktopBundleCols || 1,
    desktopMaxCount: blockConfig.desktopMaxCount || 3,
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
    mobileLayout: blockConfig.mobileLayout || "grid",
    mobileCols: blockConfig.mobileCols || 1,
    mobileCarouselSlidesPerView: blockConfig.mobileCarouselSlidesPerView || 1,
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
  }

  return {
    id: `bundle-sale-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: "BundleSaleBlock",
    props: {
      product,
      region,
      config: data,
    },
  }
}
