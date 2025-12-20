/**
 * Block Handlers
 * 处理不同类型的 block 配置
 */

import type { HttpTypes } from '@medusajs/types';
import type { BlockConfig } from './getPageLayoutBlocks';

/**
 * 处理 FeaturedCollections Block
 */
export function handleFeaturedCollectionsBlock(
  block: {
    id: string;
    type: string;
    enabled: boolean;
    order: number;
    config: Record<string, any>;
  },
  blockConfig: Record<string, any>,
  collections: HttpTypes.StoreCollection[],
  region: HttpTypes.StoreRegion
): BlockConfig | null {
  // 从配置中获取要显示的集合 ID 列表（只取第一个）
  const collectionIds = blockConfig.collectionIds || [];
  const collectionId = collectionIds[0];

  // 如果没有配置集合 ID，返回 null（不显示）
  if (!collectionId) {
    return null;
  }

  // 根据 collectionId 查找集合
  const featuredCollection = collections.find(c => c.id === collectionId);

  // 如果没有找到集合，返回 null
  if (!featuredCollection) {
    return null;
  }

  // 从配置中读取其他设置
  const title = blockConfig.title || '';
  const subtitle = blockConfig.subtitle || '';
  const showTitle = blockConfig.showTitle !== false;
  const showSubtitle = blockConfig.showSubtitle !== false;
  const titleAlign = blockConfig.titleAlign || 'left';
  const maxCount = blockConfig.maxCount || 6; // 默认显示 6 个产品
  const desktopCols = blockConfig.desktopCols || 3; // 默认桌面端 3 列
  const mobileCols = blockConfig.mobileCols || 2; // 默认移动端 2 列

  return {
    id: `featured-collections-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: 'FeaturedCollections',
    props: {
      collection: featuredCollection, // 传递单个集合
      region,
      title,
      subtitle,
      showTitle,
      showSubtitle,
      titleAlign,
      maxCount, // 传递 maxCount 用于限制产品数量
      desktopCols, // 传递桌面端列数
      mobileCols, // 传递移动端列数
    },
  };
}

