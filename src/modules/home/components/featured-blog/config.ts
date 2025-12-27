import type { FeaturedBlogData } from './types';

/**
 * 特色博客默认配置
 */
export const FEATURED_BLOG_CONFIG = {
  /** 默认最大显示数量 */
  defaultMaxCount: 6,
  /** 默认显示查看全部 */
  defaultShowViewAll: true,
  /** 默认查看全部文字 */
  defaultViewAllText: 'View All Articles',
  /** 默认桌面端列数 */
  defaultDesktopCols: 3,
  /** 默认桌面端最大显示数量 */
  defaultDesktopMaxCount: 6,
  /** 默认桌面端启用轮播 */
  defaultDesktopEnableCarousel: false,
  /** 默认桌面端轮播配置 */
  defaultDesktopCarouselConfig: {
    loop: false,
    autoplay: false,
    autoplayDelay: 3000,
    spacing: 24,
    showNavigation: true,
    showPagination: true,
    align: 'start' as const,
    draggable: true,
  },
  /** 默认移动端布局 */
  defaultMobileLayout: 'carousel' as const,
  /** 默认移动端网格列数 */
  defaultMobileCols: 2,
  /** 默认移动端轮播配置 */
  defaultMobileCarouselConfig: {
    slidesPerView: 1.5,
    spaceBetween: 16,
    showNavigation: false,
    showPagination: true,
    loop: false,
    autoplay: false,
    autoplayDelay: 3000,
    align: 'start' as const,
    draggable: true,
  },
  /** 默认启用动画 */
  defaultEnableAnimation: true,
} as const;

/**
 * 默认特色博客数据
 */
export const DEFAULT_FEATURED_BLOG_DATA: Partial<FeaturedBlogData> = {
  articles: [],
  maxCount: FEATURED_BLOG_CONFIG.defaultMaxCount,
  showViewAll: FEATURED_BLOG_CONFIG.defaultShowViewAll,
  viewAllText: FEATURED_BLOG_CONFIG.defaultViewAllText,
  // 桌面端配置
  desktopCols: FEATURED_BLOG_CONFIG.defaultDesktopCols,
  desktopMaxCount: FEATURED_BLOG_CONFIG.defaultDesktopMaxCount,
  desktopEnableCarousel: FEATURED_BLOG_CONFIG.defaultDesktopEnableCarousel,
  desktopCarouselConfig: FEATURED_BLOG_CONFIG.defaultDesktopCarouselConfig,
  // 移动端配置
  mobileLayout: FEATURED_BLOG_CONFIG.defaultMobileLayout,
  mobileCols: FEATURED_BLOG_CONFIG.defaultMobileCols,
  mobileCarouselConfig: FEATURED_BLOG_CONFIG.defaultMobileCarouselConfig,
  // 动画配置
  enableAnimation: FEATURED_BLOG_CONFIG.defaultEnableAnimation,
};

