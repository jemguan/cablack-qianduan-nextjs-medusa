'use client';

import { EmblaCarousel } from '@lib/ui/embla-carousel';
import ProductPreview from '@modules/products/components/product-preview';
import type { HttpTypes } from '@medusajs/types';
import type { RecentlyViewedProductsData } from './types';

interface DesktopRecentlyViewedProductsProps {
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
 * 桌面端最近浏览产品组件
 * 根据配置选择显示模式：
 * - 如果启用轮播且产品数量 > desktopMaxCount: 使用轮播布局
 * - 否则: 使用网格布局
 */
export function DesktopRecentlyViewedProducts({
  products,
  region,
  className = '',
  config,
}: DesktopRecentlyViewedProductsProps) {
  // 判断是否使用轮播：启用轮播且产品数量超过阈值
  const shouldUseCarousel =
    config.desktopEnableCarousel &&
    products.length > (config.desktopMaxCount || 6);

  // 生成响应式网格类名
  const gridColsMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
  };
  const desktopCols = config.desktopCols || 3;
  const gridClasses = `grid ${gridColsMap[desktopCols] || 'grid-cols-3'} gap-6`;

  return (
    <div className={className}>
      {shouldUseCarousel ? (
        // 轮播布局模式 - 使用 EmblaCarousel
        <div>
          <EmblaCarousel
            desktopSlidesPerView={desktopCols}
            mobileSlidesPerView={1}
            spacing={config.desktopCarouselSpacing || 24}
            showPagination={config.desktopCarouselShowPagination ?? true}
            showNavigation={config.desktopCarouselShowNavigation ?? true}
            loop={
              config.desktopCarouselLoop ??
              (products.length > desktopCols ? true : false)
            }
            autoplay={config.desktopCarouselAutoplay ?? false}
            autoplayDelay={config.desktopCarouselAutoplayDelay || 3000}
            align={config.desktopCarouselAlign || 'start'}
            draggable={config.desktopCarouselDraggable ?? true}
          >
            {products.map((product, index) => (
              <ProductPreview
                key={product.id || index}
                product={product}
                region={region}
              />
            ))}
          </EmblaCarousel>
        </div>
      ) : (
        // 网格布局模式 - 显示所有产品
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

