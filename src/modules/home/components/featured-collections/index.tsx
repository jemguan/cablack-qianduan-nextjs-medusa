/**
 * Featured Collections 组件
 * 根据配置显示单个集合的产品
 */

import { HttpTypes } from '@medusajs/types';
import { listProducts } from '@lib/data/products';
import { FeaturedCollectionsClient } from './FeaturedCollectionsClient';

interface FeaturedCollectionsProps {
  category: HttpTypes.StoreProductCategory; // 单个分类
  region: HttpTypes.StoreRegion;
  title?: string;
  subtitle?: string;
  showTitle?: boolean;
  showSubtitle?: boolean;
  titleAlign?: 'left' | 'center' | 'right';
  maxCount?: number; // 最大显示产品数
  desktopCols?: number; // 桌面端每行显示数量
  desktopMaxCount?: number; // 桌面端最大显示数量
  desktopEnableCarousel?: boolean; // 桌面端是否启用轮播
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
  mobileLayout?: 'grid' | 'carousel'; // 移动端布局模式
  mobileCols?: number; // 移动端每行显示数量
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
  showViewAll?: boolean; // 是否显示查看全部按钮
  viewAllUrl?: string; // 查看全部链接
  viewAllText?: string; // 查看全部按钮文字
}

export default async function FeaturedCollections({
  category,
  region,
  title,
  subtitle,
  showTitle = true,
  showSubtitle = true,
  titleAlign = 'left',
  maxCount = 6,
  desktopCols = 3,
  desktopMaxCount,
  desktopEnableCarousel = false,
  desktopCarouselConfig,
  mobileLayout = 'carousel',
  mobileCols = 2,
  mobileCarouselConfig,
  showViewAll = false,
  viewAllUrl,
  viewAllText = 'View All',
}: FeaturedCollectionsProps) {
  if (!category) {
    return null;
  }

  // 获取该分类的产品
  const {
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      category_id: category.id,
      fields: "*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*variants.images.id,*variants.images.url,*variants.images.metadata",
    },
  });

  if (!pricedProducts || pricedProducts.length === 0) {
    return null;
  }

  // 如果没有配置 viewAllUrl，使用分类的链接
  const finalViewAllUrl = viewAllUrl || `/categories/${category.handle}`;

  return (
    <div className="content-container py-12 small:py-24">
      <FeaturedCollectionsClient
        category={category}
        region={region}
        products={pricedProducts}
        title={title}
        subtitle={subtitle}
        showTitle={showTitle}
        showSubtitle={showSubtitle}
        titleAlign={titleAlign}
        maxCount={maxCount}
        desktopCols={desktopCols}
        desktopMaxCount={desktopMaxCount}
        desktopEnableCarousel={desktopEnableCarousel}
        desktopCarouselConfig={desktopCarouselConfig}
        mobileLayout={mobileLayout}
        mobileCols={mobileCols}
        mobileCarouselConfig={mobileCarouselConfig}
        showViewAll={showViewAll}
        viewAllUrl={finalViewAllUrl}
        viewAllText={viewAllText}
      />
    </div>
  );
}

