/**
 * Bundle Sale Block 配置常量
 */

import type { BundleSaleData } from "./types"

/**
 * 默认配置
 */
export const DEFAULT_BUNDLE_SALE_CONFIG: Required<BundleSaleData> = {
  /** 默认启用 */
  enabled: true,
  /** 默认标题 */
  title: "Bundle Deals",
  /** 默认副标题 */
  subtitle: "Save more when you buy together",
  /** 默认显示标题 */
  showTitle: true,
  /** 默认显示副标题 */
  showSubtitle: true,
  /** 标题对齐方式 */
  titleAlign: "left",
  /** 默认最大显示数量 */
  maxItems: 4,
  /** 默认显示产品列表 */
  showProducts: true,
  /** 默认产品显示数量 */
  maxProducts: 4,
  /** 默认桌面端可见 */
  showOnDesktop: true,
  /** 默认移动端可见 */
  showOnMobile: true,
  /** 默认 CTA 文本 */
  ctaText: "Buy Together & Save",
  /** 默认显示折扣标签 */
  showDiscountBadge: true,
  /** 桌面端配置 */
  desktopBundleCols: 1,
  desktopMaxCount: 3,
  desktopEnableCarousel: false,
  desktopCarouselLoop: false,
  desktopCarouselAutoplay: false,
  desktopCarouselAutoplayDelay: 3000,
  desktopCarouselSpacing: 24,
  desktopCarouselShowNavigation: true,
  desktopCarouselShowPagination: true,
  desktopCarouselAlign: "start",
  desktopCarouselDraggable: true,
  /** 移动端配置 */
  mobileLayout: "grid",
  mobileCols: 1,
  mobileCarouselSlidesPerView: 1,
  mobileCarouselLoop: false,
  mobileCarouselAutoplay: false,
  mobileCarouselAutoplayDelay: 3000,
  mobileCarouselSpacing: 16,
  mobileCarouselShowNavigation: false,
  mobileCarouselShowPagination: true,
  mobileCarouselAlign: "start",
  mobileCarouselDraggable: true,
} as const

