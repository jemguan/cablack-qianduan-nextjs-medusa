"use client"

import { HttpTypes } from '@medusajs/types';
import DynamicProductCard from '@modules/products/components/dynamic-product-card';
import { EmblaCarousel } from '@lib/ui/embla-carousel';
import type { Brand } from '@lib/data/brands';

interface MobileFeaturedCollectionsProps {
  category: HttpTypes.StoreProductCategory;
  region: HttpTypes.StoreRegion;
  products: HttpTypes.StoreProduct[];
  productBrands?: Record<string, Brand | null>;
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
  customer?: HttpTypes.StoreCustomer | null;
}

/**
 * 移动端特色集合组件
 */
export function MobileFeaturedCollections({
  category: _category,
  region,
  products,
  productBrands,
  maxCount = 6,
  mobileLayout = 'carousel',
  mobileCols = 2,
  mobileCarouselConfig,
  customer,
}: MobileFeaturedCollectionsProps) {
  if (!products || products.length === 0) {
    return null;
  }

  const displayProducts = products.slice(0, maxCount);

  if (mobileLayout === 'grid') {
    // 网格布局
    return (
      <ul
          className="grid gap-x-6 gap-y-24 place-items-center"
          style={{
            gridTemplateColumns: `repeat(${mobileCols}, minmax(0, 1fr))`
          }}
        >
          {displayProducts.map((product) => (
            <li key={product.id}>
              <DynamicProductCard product={product} region={region} isFeatured customer={customer} brand={productBrands?.[product.id]} />
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
          <DynamicProductCard key={product.id} product={product} region={region} isFeatured customer={customer} brand={productBrands?.[product.id]} />
        ))}
      </EmblaCarousel>
  );
}

