/**
 * TextBlock Block Handler
 * 处理文本块
 */

import type { TextBlockData } from '../../components/text-block/types';
import type { BlockBase, BlockConfig } from './types';
import { generateUniqueId } from './types';

/**
 * 处理 TextBlock Block
 */
export function handleTextBlockBlock(
  block: BlockBase,
  blockConfig: Record<string, any>
): BlockConfig | null {
  // 构建 TextBlockData
  const textBlockData: TextBlockData = {
    title: blockConfig.title || '',
    subtitle: blockConfig.subtitle || '',
    showTitle: blockConfig.showTitle !== false,
    showSubtitle: blockConfig.showSubtitle !== false,
    titleAlign: blockConfig.titleAlign || 'left',
    modules: (blockConfig.modules || []).map((module: any) => ({
      id: module.id || generateUniqueId('module'),
      title: module.title,
      titleColor: module.titleColor,
      subtitle: module.subtitle,
      subtitleColor: module.subtitleColor,
      content: module.content || '',
      contentMode: module.contentMode || 'text',
      desktopCollapsedLines: module.desktopCollapsedLines ?? 3,
      mobileCollapsedLines: module.mobileCollapsedLines ?? 3,
      expandButtonText: module.expandButtonText || 'Read More',
      collapseButtonText: module.collapseButtonText || 'Show Less',
      showOnDesktop: module.showOnDesktop !== false,
      showOnMobile: module.showOnMobile !== false,
      textAlign: module.textAlign || 'left',
      desktopRows: module.desktopRows ?? 1,
      desktopCols: module.desktopCols ?? 1,
    })),
    gridCols: blockConfig.gridCols ?? 1,
    gridRows: blockConfig.gridRows ?? 1,
    gridGap: blockConfig.gridGap ?? 24,
    mobileGridCols: blockConfig.mobileGridCols ?? 1,
  };

  return {
    id: `text-block-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: 'TextBlock',
    props: {
      data: textBlockData,
    },
  };
}
