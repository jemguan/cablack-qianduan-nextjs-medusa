import type { BrandShowcaseData } from './types';

/**
 * 品牌展示区块默认配置
 */
export const DEFAULT_BRAND_SHOWCASE_CONFIG: Partial<BrandShowcaseData> = {
  // 桌面端配置
  desktopCols: 3,
  desktopEnableCarousel: false,
  desktopCarouselConfig: {
    loop: false,
    autoplay: false,
    autoplayDelay: 3000,
    spacing: 24,
    showNavigation: true,
    showPagination: true,
    align: 'start' as const,
    draggable: true,
  },

  // 移动端配置
  mobileLayout: 'carousel' as const,
  mobileCols: 2,
  mobileCarouselConfig: {
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

  showBrandName: true,
  imageFit: 'contain',
};

