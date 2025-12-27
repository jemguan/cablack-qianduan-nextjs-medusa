'use client';

import { EmblaCarousel } from '@lib/ui/embla-carousel';
import ProductPreview from '@modules/products/components/product-preview';
import type { HttpTypes } from '@medusajs/types';
import type { RecentlyViewedProductsData } from './types';

interface MobileRecentlyViewedProductsProps {
  /** 最近浏览产品列表 */
  products: HttpTypes.StoreProduct[];
  /** 区域信息 */
  region: HttpTypes.StoreRegion;
  /** 自定义CSS类名 */
  className?: string;
  /** Block 配置 */
  config: RecentlyViewedProductsData;
}

/**
 * 移动端最近浏览产品组件
 * 根据配置选择显示模式：
 * - 如果 mobileLayout 为 'carousel': 使用轮播布局
 * - 否则: 使用网格布局
 */
export function MobileRecentlyViewedProducts({
  products,
  region,
  className = '',
  config,
}: MobileRecentlyViewedProductsProps) {
  // 生成网格类名
  const gridColsMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
  };
  const mobileCols = config.mobileCols || 2;
  const gridClasses =
    config.mobileLayout === 'grid'
      ? `grid ${gridColsMap[mobileCols] || 'grid-cols-2'} gap-4`
      : '';

  return (
    <div className={className}>
      {config.mobileLayout === 'carousel' ? (
        // 轮播布局模式 - 使用 EmblaCarousel
        <EmblaCarousel
          mobileSlidesPerView={config.mobileCarouselSlidesPerView || 1.5}
          desktopSlidesPerView={4}
          spacing={config.mobileCarouselSpacing || 16}
          showPagination={config.mobileCarouselShowPagination ?? true}
          showNavigation={config.mobileCarouselShowNavigation ?? false}
          loop={config.mobileCarouselLoop ?? false}
          autoplay={config.mobileCarouselAutoplay ?? false}
          autoplayDelay={config.mobileCarouselAutoplayDelay || 3000}
          align={config.mobileCarouselAlign || 'start'}
          draggable={config.mobileCarouselDraggable ?? true}
        >
          {products.map((product, index) => (
            <ProductPreview
              key={product.id || index}
              product={product}
              region={region}
            />
          ))}
        </EmblaCarousel>
      ) : (
        // 网格布局模式
        <ul className={gridClasses}>
          {products.map((product, index) => (
            <li key={product.id || index}>
              <ProductPreview
                product={product}
                region={region}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

