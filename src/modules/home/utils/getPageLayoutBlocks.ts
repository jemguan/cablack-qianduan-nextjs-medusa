/**
 * 根据 pageLayouts 配置生成首页的 blocks
 * 支持多个相同类型的 block，按照 order 排序
 */

import type { MedusaConfig } from '@lib/admin-api/config';
import type { HttpTypes } from '@medusajs/types';
import { getPageLayoutBlocks } from '@lib/admin-api/pageLayoutUtils';
import { handleFeaturedCollectionsBlock, handleCollageHeroBlock, handleBrandShowcaseBlock } from './blockHandlers';

export interface BlockConfig {
  id: string;
  type: string;
  enabled: boolean;
  order: number;
  config: Record<string, any>;
  componentName?: string; // 组件名称，用于动态导入
  props?: Record<string, any>;
}

/**
 * 获取首页的布局 blocks
 * @param config Medusa 配置
 * @param collections 所有集合数据
 * @param region 区域信息
 * @param products 产品数据（用于 CollageHero 等需要产品的 blocks）
 * @returns 排序后的 block 配置数组
 */
export function getHomePageLayoutBlocks(
  config: MedusaConfig | null | undefined,
  collections: HttpTypes.StoreCollection[],
  region: HttpTypes.StoreRegion,
  products?: HttpTypes.StoreProduct[]
): BlockConfig[] {
  // 从 pageLayouts 获取 blocks
  const blocks = getPageLayoutBlocks(config, 'home');

  if (blocks.length === 0) {
    // 如果没有配置，返回空数组（向后兼容：可以返回默认布局）
    return [];
  }

  const blockConfigs: BlockConfig[] = [];

  for (const block of blocks) {
    const blockConfig = getBlockConfigForBlock(block, config, collections, region, products);
    if (blockConfig) {
      blockConfigs.push(blockConfig);
    }
  }

  return blockConfigs;
}

/**
 * 根据 block 类型生成对应的配置
 */
function getBlockConfigForBlock(
  block: {
    id: string;
    type: string;
    enabled: boolean;
    order: number;
    config: Record<string, any>;
  },
  config: MedusaConfig | null | undefined,
  collections: HttpTypes.StoreCollection[],
  region: HttpTypes.StoreRegion,
  products?: HttpTypes.StoreProduct[]
): BlockConfig | null {
  switch (block.type) {
    case 'featuredCollections':
      return handleFeaturedCollectionsBlock(block, block.config, collections, region);

    case 'collageHero':
      return handleCollageHeroBlock(block, block.config, products, region);

    case 'brandShowcase':
      return handleBrandShowcaseBlock(block, block.config);

    // 可以在这里添加更多 block 类型的处理
    // case 'hero':
    //   return handleHeroBlock(block, block.config);
    // case 'recommendedProducts':
    //   return handleRecommendedProductsBlock(block, block.config, region);

    default:
      console.warn(`[Medusa HomePage] Unknown block type: ${block.type}`);
      return null;
  }
}

