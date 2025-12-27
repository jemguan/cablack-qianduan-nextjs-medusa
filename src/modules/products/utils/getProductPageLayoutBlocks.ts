/**
 * 根据 pageLayouts 配置生成产品页的 blocks
 * 支持多个相同类型的 block，按照 order 排序
 */

import type { MedusaConfig } from '@lib/admin-api/config';
import type { HttpTypes } from '@medusajs/types';
import { getPageLayoutBlocks } from '@lib/admin-api/pageLayoutUtils';
import {
  handleProductContentBlock,
  handleFAQBlock,
  handleRecentlyViewedProductsBlock,
} from './blockHandlers';

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
 * 获取产品页的布局 blocks
 * @param config Medusa 配置
 * @param product 产品数据
 * @param region 区域信息
 * @param images 产品图片
 * @param initialVariantId 初始变体 ID
 * @returns 排序后的 block 配置数组
 */
export function getProductPageLayoutBlocks(
  config: MedusaConfig | null | undefined,
  product: HttpTypes.StoreProduct,
  region: HttpTypes.StoreRegion,
  images: HttpTypes.StoreProductImage[],
  initialVariantId?: string,
  countryCode?: string
): BlockConfig[] {
  // 从 pageLayouts 获取 blocks
  const blocks = getPageLayoutBlocks(config, 'product');

  if (blocks.length === 0) {
    // 如果没有配置，返回默认的 productContent block（向后兼容）
    const productPageConfig = config?.productPageConfig || {};
    const shippingReturnsConfig = config?.shippingReturnsConfig;
    return [
      {
        id: 'product-content-default',
        type: 'productContent',
        enabled: true,
        order: 0,
        config: {
          ...productPageConfig,
          layout: productPageConfig.layout || 'two-column',
          shippingReturnsConfig,
        },
        componentName: 'ProductContent',
        props: {
          product,
          region,
          images,
          initialVariantId,
          layout: productPageConfig.layout || 'two-column',
          shippingReturnsConfig,
        },
      },
    ];
  }

  const blockConfigs: BlockConfig[] = [];

  for (const block of blocks) {
    const blockConfig = getBlockConfigForBlock(
      block,
      config,
      product,
      region,
      images,
      initialVariantId,
      countryCode
    );
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
  product: HttpTypes.StoreProduct,
  region: HttpTypes.StoreRegion,
  images: HttpTypes.StoreProductImage[],
  initialVariantId?: string,
  countryCode?: string
): BlockConfig | null {
  switch (block.type) {
    case 'productContent':
      // 从 blockConfigs 获取配置，如果没有则从旧格式 productPageConfig 读取
      const blockConfig =
        config?.blockConfigs?.['productContent']?.[block.id] ||
        block.config ||
        {};
      const shippingReturnsConfig =
        blockConfig.shippingReturnsConfig ||
        config?.shippingReturnsConfig;
      return handleProductContentBlock(
        block,
        {
          ...blockConfig,
          shippingReturnsConfig,
        },
        product,
        region,
        images,
        initialVariantId
      );

    case 'faq':
      // 从 blockConfigs 获取配置，如果没有则使用 block.config
      const faqBlockConfig =
        config?.blockConfigs?.['faq']?.[block.id] ||
        block.config ||
        {};
      return handleFAQBlock(block, faqBlockConfig, product);

    case 'recentlyViewedProducts':
      // 从 blockConfigs 获取配置，如果没有则使用 block.config
      const recentlyViewedBlockConfig =
        config?.blockConfigs?.['recentlyViewedProducts']?.[block.id] ||
        block.config ||
        {};
      return handleRecentlyViewedProductsBlock(
        block,
        recentlyViewedBlockConfig,
        product,
        region,
        countryCode
      );

    default:
      console.warn(`[Medusa ProductPage] Unknown block type: ${block.type}`);
      return null;
  }
}

