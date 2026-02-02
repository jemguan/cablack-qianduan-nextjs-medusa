/**
 * Medusa 页面布局工具函数
 * 用于根据 pageLayouts 和 blockConfigs 获取和渲染页面 blocks
 */

import type { MedusaConfig } from './config';

export interface SlotBinding {
  parent_id: string;
  slot_id: string;
}

export interface PageBlock {
  id: string;
  type: string;
  enabled: boolean;
  order: number;
  config: Record<string, any>;
  parent_id?: string | null;
  slot_id?: string | null;
  slot_bindings?: SlotBinding[];
  visibility?: 'all' | 'desktop_only' | 'mobile_only';
}

export interface PageBlockNode extends PageBlock {
  children: PageBlockNode[];
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
        parent_id: block.parent_id || null,
        slot_id: block.slot_id || null,
        slot_bindings: blockConfig.slot_bindings as SlotBinding[] | undefined,
        visibility: block.visibility || 'all',
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

/**
 * 将扁平 blocks 转换为树形结构
 * 没有 parent_id 的 block 视为根节点（向后兼容）
 */
export function getPageLayoutBlocksTree(
  config: MedusaConfig | null | undefined,
  pageType: string
): PageBlockNode[] {
  const flatBlocks = getPageLayoutBlocks(config, pageType);

  // 先创建所有容器节点（compositeContainer 类型）
  const blockMap = new Map<string, PageBlockNode>();
  for (const block of flatBlocks) {
    blockMap.set(block.id, { ...block, children: [] });
  }

  const roots: PageBlockNode[] = [];

  for (const block of flatBlocks) {
    const node = blockMap.get(block.id)!;

    // 多绑定：slot_bindings 数组，将 block 克隆到多个父容器
    const validBindings = (block.slot_bindings || []).filter(b => b.parent_id && blockMap.has(b.parent_id));
    if (validBindings.length > 0) {
      for (const binding of validBindings) {
        const clone: PageBlockNode = {
          ...block,
          parent_id: binding.parent_id,
          slot_id: binding.slot_id || 'default',
          children: [],
        };
        blockMap.get(binding.parent_id)!.children.push(clone);
      }
      // 有效绑定的 block 不作为根节点
      continue;
    }

    // 旧的单绑定兼容
    if (block.parent_id && blockMap.has(block.parent_id)) {
      blockMap.get(block.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // 递归按 order 排序子节点
  const sortChildren = (nodes: PageBlockNode[]) => {
    nodes.sort((a, b) => a.order - b.order);
    nodes.forEach(n => sortChildren(n.children));
  };
  sortChildren(roots);

  return roots;
}

/**
 * 按 slot_id 分组子节点
 */
export function groupChildrenBySlot(
  children: PageBlockNode[]
): Map<string, PageBlockNode[]> {
  const slots = new Map<string, PageBlockNode[]>();
  for (const child of children) {
    const slotId = child.slot_id || 'default';
    if (!slots.has(slotId)) slots.set(slotId, []);
    slots.get(slotId)!.push(child);
  }
  return slots;
}

