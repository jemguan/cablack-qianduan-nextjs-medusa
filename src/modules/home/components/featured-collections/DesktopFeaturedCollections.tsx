"use client"

import { HttpTypes } from '@medusajs/types';
import ProductPreview from '@modules/products/components/product-preview';
import { EmblaCarousel } from '@lib/ui/embla-carousel';

interface DesktopFeaturedCollectionsProps {
  collection: HttpTypes.StoreCollection;
  region: HttpTypes.StoreRegion;
  products: HttpTypes.StoreProduct[];
  maxCount?: number;
  desktopCols?: number;
  desktopMaxCount?: number;
  desktopEnableCarousel?: boolean;
  desktopCarouselConfig?: {
    loop?: boolean;
    autoplay?: boolean;
    autoplayDelay?: number;
    spacing?: number;
    showNavigation?: boolean;
    showPagination?: boolean;
    align?: 'start' | 'center' | 'end';
    draggable?: boolean;
  };
}

/**
 * 桌面端特色集合组件
 */
export function DesktopFeaturedCollections({
  collection: _collection,
  region,
  products,
  maxCount = 6,
  desktopCols = 3,
  desktopMaxCount,
  desktopEnableCarousel = false,
  desktopCarouselConfig,
}: DesktopFeaturedCollectionsProps) {
  if (!products || products.length === 0) {
    return null;
  }

  // 确定是否使用轮播
  // 如果启用了轮播，就使用轮播模式（不管产品数量）
  const shouldUseCarousel = desktopEnableCarousel === true;
  const displayCount = shouldUseCarousel ? products.length : (desktopMaxCount || maxCount);
  const displayProducts = shouldUseCarousel ? products : products.slice(0, displayCount);

  if (shouldUseCarousel) {
    // 轮播布局 - 使用 EmblaCarousel
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
          {displayProducts.map((product) => (
            <ProductPreview key={product.id} product={product} region={region} isFeatured />
          ))}
        </EmblaCarousel>
    );
  }

  // 网格布局
  return (
    <ul 
        className="grid gap-x-6 gap-y-24 small:gap-y-36"
        style={{
          gridTemplateColumns: `repeat(${desktopCols}, minmax(0, 1fr))`
        }}
      >
        {displayProducts.map((product) => (
          <li key={product.id}>
            <ProductPreview product={product} region={region} isFeatured />
          </li>
        ))}
      </ul>
  );
}

