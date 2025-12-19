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
  // 从配置中获取要显示的集合 ID 列表
  const collectionIds = blockConfig.collectionIds || [];

  // 如果没有配置集合 ID，返回 null（不显示）
  if (collectionIds.length === 0) {
    return null;
  }

  // 根据 collectionIds 过滤集合，保持顺序
  const featuredCollections = collectionIds
    .map((id: string) => collections.find(c => c.id === id))
    .filter((c): c is HttpTypes.StoreCollection => c !== undefined);

  // 如果没有找到任何集合，返回 null
  if (featuredCollections.length === 0) {
    return null;
  }

  // 从配置中读取其他设置
  const title = blockConfig.title || '';
  const subtitle = blockConfig.subtitle || '';
  const showTitle = blockConfig.showTitle !== false;
  const showSubtitle = blockConfig.showSubtitle !== false;
  const titleAlign = blockConfig.titleAlign || 'left';
  const maxCount = blockConfig.maxCount || featuredCollections.length;

  return {
    id: `featured-collections-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: 'FeaturedCollections',
    props: {
      collections: featuredCollections.slice(0, maxCount),
      region,
      title,
      subtitle,
      showTitle,
      showSubtitle,
      titleAlign,
    },
  };
}

