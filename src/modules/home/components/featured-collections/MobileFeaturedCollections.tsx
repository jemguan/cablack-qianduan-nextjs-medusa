"use client"

import { HttpTypes } from '@medusajs/types';
import ProductPreview from '@modules/products/components/product-preview';
import { EmblaCarousel } from '@lib/ui/embla-carousel';

interface MobileFeaturedCollectionsProps {
  collection: HttpTypes.StoreCollection;
  region: HttpTypes.StoreRegion;
  products: HttpTypes.StoreProduct[];
  maxCount?: number;
  mobileLayout?: 'grid' | 'carousel';
  mobileCols?: number;
  mobileCarouselConfig?: {
    slidesPerView?: number;
    spaceBetween?: number;
    showNavigation?: boolean;
    showPagination?: boolean;
    loop?: boolean;
    autoplay?: boolean;
    autoplayDelay?: number;
    align?: 'start' | 'center' | 'end';
    draggable?: boolean;
  };
}

/**
 * 移动端特色集合组件
 */
export function MobileFeaturedCollections({
  collection: _collection,
  region,
  products,
  maxCount = 6,
  mobileLayout = 'carousel',
  mobileCols = 2,
  mobileCarouselConfig,
}: MobileFeaturedCollectionsProps) {
  if (!products || products.length === 0) {
    return null;
  }

  const displayProducts = products.slice(0, maxCount);

  if (mobileLayout === 'grid') {
    // 网格布局
    return (
      <ul 
          className="grid gap-x-6 gap-y-24"
          style={{
            gridTemplateColumns: `repeat(${mobileCols}, minmax(0, 1fr))`
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
        {displayProducts.map((product) => (
          <ProductPreview key={product.id} product={product} region={region} isFeatured />
        ))}
      </EmblaCarousel>
  );
}

