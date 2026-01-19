/**
 * FeaturedCollections Block Handler
 * 处理精选分类展示块
 */

import type { HttpTypes } from '@medusajs/types';
import type { BlockBase, BlockConfig } from './types';
import { extractDesktopCarouselConfig, extractMobileCarouselConfig } from './types';

/**
 * 处理 FeaturedCollections Block
 */
export function handleFeaturedCollectionsBlock(
  block: BlockBase,
  blockConfig: Record<string, any>,
  categories: HttpTypes.StoreProductCategory[],
  region: HttpTypes.StoreRegion
): BlockConfig | null {
  // 从配置中获取要显示的分类 ID 列表（只取第一个）
  const collectionIds = blockConfig.collectionIds || [];
  const categoryId = collectionIds[0];

  // 如果没有配置分类 ID，返回 null（不显示）
  if (!categoryId) {
    return null;
  }

  // 根据 categoryId 查找分类
  const featuredCategory = categories.find(c => c.id === categoryId);

  // 如果没有找到分类，返回 null
  if (!featuredCategory) {
    return null;
  }

  // 从配置中读取其他设置
  const title = blockConfig.title || '';
  const subtitle = blockConfig.subtitle || '';
  const showTitle = blockConfig.showTitle !== false;
  const showSubtitle = blockConfig.showSubtitle !== false;
  const titleAlign = blockConfig.titleAlign || 'left';
  const maxCount = blockConfig.maxCount || 6;
  const desktopCols = blockConfig.desktopCols || 3;
  const desktopMaxCount = blockConfig.desktopMaxCount;
  const desktopEnableCarousel = blockConfig.desktopEnableCarousel || false;
  const desktopCarouselConfig = extractDesktopCarouselConfig(blockConfig, 'desktop');
  const mobileLayout = blockConfig.mobileLayout || 'carousel';
  const mobileCols = blockConfig.mobileCols || 2;
  const mobileCarouselConfig = extractMobileCarouselConfig(blockConfig, 'mobile');
  const showViewAll = blockConfig.showViewAll || false;
  const viewAllUrl = blockConfig.viewAllUrl;
  const viewAllText = blockConfig.viewAllText || 'View All';

  return {
    id: `featured-collections-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: 'FeaturedCollections',
    props: {
      category: featuredCategory,
      region,
      title,
      subtitle,
      showTitle,
      showSubtitle,
      titleAlign,
      maxCount,
      desktopCols,
      desktopMaxCount,
      desktopEnableCarousel,
      desktopCarouselConfig,
      mobileLayout,
      mobileCols,
      mobileCarouselConfig,
      showViewAll,
      viewAllUrl,
      viewAllText,
    },
  };
}
