"use client"

import type { BrandShowcaseData } from './types';
import { BrandCard } from './BrandCard';
import { DEFAULT_BRAND_SHOWCASE_CONFIG } from './config';
import { EmblaCarousel } from '@lib/ui/embla-carousel';

interface MobileBrandShowcaseProps {
  /** 品牌展示数据 */
  data: BrandShowcaseData;
}

/**
 * 移动端品牌展示组件
 * 支持网格布局和轮播布局两种模式
 */
export function MobileBrandShowcase({ data }: MobileBrandShowcaseProps) {
  const {
    brands,
    mobileLayout = DEFAULT_BRAND_SHOWCASE_CONFIG.mobileLayout,
    mobileCols = DEFAULT_BRAND_SHOWCASE_CONFIG.mobileCols,
    mobileCarouselConfig,
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

  // 根据移动端布局选择渲染方式
  if (mobileLayout === 'carousel') {
    // 轮播布局
    return (
      <EmblaCarousel
        mobileSlidesPerView={mobileCarouselConfig?.slidesPerView || 1.5}
        desktopSlidesPerView={3}
        spacing={mobileCarouselConfig?.spaceBetween || 16}
        showPagination={mobileCarouselConfig?.showPagination !== false}
        showNavigation={mobileCarouselConfig?.showNavigation || false}
        loop={mobileCarouselConfig?.loop || false}
        autoplay={mobileCarouselConfig?.autoplay || false}
        autoplayDelay={mobileCarouselConfig?.autoplayDelay || 3000}
        align={mobileCarouselConfig?.align || 'start'}
        draggable={mobileCarouselConfig?.draggable ?? true}
      >
        {renderBrandCards()}
      </EmblaCarousel>
    );
  }

  // 网格布局
  const gridColsClass = `grid-cols-${mobileCols}`;

  return <div className={`grid ${gridColsClass} gap-4`}>{renderBrandCards()}</div>;
}

