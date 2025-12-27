import type { RecentlyViewedProductsData } from './types';

/**
 * 最近浏览产品 Block 默认配置
 */
export const DEFAULT_RECENTLY_VIEWED_BLOCK_CONFIG: RecentlyViewedProductsData = {
  enabled: true,
  limit: 8,
  layout: 'grid',
  desktopCols: 3,
  desktopMaxCount: 6,
  desktopEnableCarousel: false,
  desktopCarouselLoop: false,
  desktopCarouselAutoplay: false,
  desktopCarouselAutoplayDelay: 3000,
  desktopCarouselSpacing: 24,
  desktopCarouselShowNavigation: true,
  desktopCarouselShowPagination: true,
  desktopCarouselAlign: 'start',
  desktopCarouselDraggable: true,
  mobileLayout: 'carousel',
  mobileCols: 2,
  mobileCarouselSlidesPerView: 1.5,
  mobileCarouselLoop: false,
  mobileCarouselAutoplay: false,
  mobileCarouselAutoplayDelay: 3000,
  mobileCarouselSpacing: 16,
  mobileCarouselShowNavigation: false,
  mobileCarouselShowPagination: true,
  mobileCarouselAlign: 'start',
  mobileCarouselDraggable: true,
  showTitle: true,
  showSubtitle: true,
  titleAlign: 'left',
} as const;

/**
 * 性能优化配置
 */
export const PERFORMANCE_CONFIG = {
  rootMargin: '800px',
  triggerOnce: true,
  maxViewedProducts: 20,
  maxDisplayProducts: 20,
} as const;

/**
 * localStorage配置
 */
export const STORAGE_CONFIG = {
  storageKey: 'medusa_recently_viewed_products',
  expirationTime: 30 * 24 * 60 * 60 * 1000, // 30天
  maxStoredProducts: 50,
} as const;

