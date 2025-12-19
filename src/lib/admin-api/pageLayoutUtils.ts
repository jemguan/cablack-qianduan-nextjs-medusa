/**
 * Medusa 页面布局工具函数
 * 用于根据 pageLayouts 和 blockConfigs 获取和渲染页面 blocks
 */

import type { MedusaConfig } from './config';

export interface PageBlock {
  id: string;
  type: string;
  enabled: boolean;
  order: number;
  config: Record<string, any>;
}

/**
 * 检查配置是否被禁用
 */
function isConfigDisabled(value: any): boolean {
  return value === false || value === 'false' || value === 'False' || value === 'FALSE';
}

/**
 * 从配置中加载指定页面的 blocks
 * @param config Medusa 配置
 * @param pageType 页面类型（'home', 'product' 等）
 * @returns 排序后的 blocks 数组
 */
export function getPageLayoutBlocks(
  config: MedusaConfig | null | undefined,
  pageType: string
): PageBlock[] {
  if (!config || !config.pageLayouts || !config.pageLayouts[pageType]) {
    return [];
  }

  const pageLayout = config.pageLayouts[pageType];
  if (!pageLayout.blocks || pageLayout.blocks.length === 0) {
    return [];
  }

  // 从 pageLayouts 获取 block 列表，并从 blockConfigs 获取配置
  const blocks: PageBlock[] = pageLayout.blocks
    .filter(block => {
      // 检查 block 级别的 enabled
      if (isConfigDisabled(block.enabled)) {
        return false;
      }

      // 从 blockConfigs 中获取该 block 的配置
      const blockConfig = config.blockConfigs?.[block.type]?.[block.id] || {};

      // 检查 config 级别的 enabled
      if (isConfigDisabled(blockConfig.enabled)) {
        return false;
      }

      // 排除 header 和 footer（它们在页面布局中单独处理）
      if (block.type === 'header' || block.type === 'footer') {
        return false;
      }

      return true;
    })
    .map(block => {
      // 从 blockConfigs 中获取该 block 的配置
      const blockConfig = config.blockConfigs?.[block.type]?.[block.id] || {};

      return {
        id: block.id,
        type: block.type,
        enabled: block.enabled !== false,
        order: typeof block.order === 'number' ? block.order : (typeof block.order === 'string' ? parseInt(block.order, 10) : 9999),
        config: blockConfig,
      };
    })
    .sort((a, b) => {
      // 按 order 排序（数字越小越靠前）
      const orderA = isNaN(a.order) ? 9999 : a.order;
      const orderB = isNaN(b.order) ? 9999 : b.order;
      return orderA - orderB;
    });

  return blocks;
}

/**
 * 获取指定页面的特定类型的 block
 * @param config Medusa 配置
 * @param pageType 页面类型
 * @param blockType block 类型
 * @returns 匹配的 block，如果没有则返回 null
 */
export function getPageBlockByType(
  config: MedusaConfig | null | undefined,
  pageType: string,
  blockType: string
): PageBlock | null {
  const blocks = getPageLayoutBlocks(config, pageType);
  return blocks.find(block => block.type === blockType) || null;
}

/**
 * 获取指定页面的特定 ID 的 block
 * @param config Medusa 配置
 * @param pageType 页面类型
 * @param blockId block ID
 * @returns 匹配的 block，如果没有则返回 null
 */
export function getPageBlockById(
  config: MedusaConfig | null | undefined,
  pageType: string,
  blockId: string
): PageBlock | null {
  const blocks = getPageLayoutBlocks(config, pageType);
  return blocks.find(block => block.id === blockId) || null;
}

