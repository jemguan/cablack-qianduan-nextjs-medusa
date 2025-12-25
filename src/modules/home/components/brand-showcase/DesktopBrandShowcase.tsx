"use client"

import type { BrandShowcaseData } from './types';
import { BrandCard } from './BrandCard';
import { DEFAULT_BRAND_SHOWCASE_CONFIG } from './config';
import { EmblaCarousel } from '@lib/ui/embla-carousel';

interface DesktopBrandShowcaseProps {
  /** 品牌展示数据 */
  data: BrandShowcaseData;
}

/**
 * 桌面端品牌展示组件
 * 支持网格布局和轮播布局两种模式
 */
export function DesktopBrandShowcase({ data }: DesktopBrandShowcaseProps) {
  const {
    brands,
    desktopCols = DEFAULT_BRAND_SHOWCASE_CONFIG.desktopCols,
    desktopEnableCarousel = DEFAULT_BRAND_SHOWCASE_CONFIG.desktopEnableCarousel,
    desktopCarouselConfig,
    showBrandName = DEFAULT_BRAND_SHOWCASE_CONFIG.showBrandName,
    imageFit = DEFAULT_BRAND_SHOWCASE_CONFIG.imageFit,
  } = data;

  if (!brands || brands.length === 0) {
    return null;
  }

  // 渲染品牌卡片
  const renderBrandCards = () =>
    brands.map((brand) => (
      <BrandCard
        key={brand.id}
        brand={brand}
        showBrandName={showBrandName}
        imageFit={imageFit}
      />
    ));

  // 轮播布局（当启用轮播时）
  if (desktopEnableCarousel) {
    return (
      <EmblaCarousel
        desktopSlidesPerView={desktopCols}
        mobileSlidesPerView={1}
        spacing={desktopCarouselConfig?.spacing || 24}
        showPagination={desktopCarouselConfig?.showPagination ?? true}
        showNavigation={desktopCarouselConfig?.showNavigation ?? true}
        loop={desktopCarouselConfig?.loop ?? false}
        autoplay={desktopCarouselConfig?.autoplay ?? false}
        autoplayDelay={desktopCarouselConfig?.autoplayDelay || 3000}
        align={desktopCarouselConfig?.align || 'start'}
        draggable={desktopCarouselConfig?.draggable ?? true}
      >
        {renderBrandCards()}
      </EmblaCarousel>
    );
  }

  // 网格布局（默认）
  const gridColsClass = `grid-cols-${desktopCols}`;

  return (
    <div className={`grid ${gridColsClass} gap-6`}>
      {renderBrandCards()}
    </div>
  );
}

