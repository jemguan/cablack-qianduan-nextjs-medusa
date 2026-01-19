/**
 * FAQ Block Handler
 * 处理常见问题块
 */

import type { FAQData } from '../../components/faq-block/types';
import type { BlockBase, BlockConfig } from './types';

/**
 * 处理 FAQ Block
 */
export function handleFAQBlock(
  block: BlockBase,
  blockConfig: Record<string, any>
): BlockConfig | null {
  // 构建 FAQData
  const faqData: FAQData = {
    items: blockConfig.items || [],
    defaultOpenFirst: blockConfig.defaultOpenFirst || false,
    allowMultiple: blockConfig.allowMultiple || false,
    theme: blockConfig.theme || 'default',
    dataMode: blockConfig.dataMode || 'direct',
    metafieldConfig: blockConfig.metafieldConfig
      ? {
          key: blockConfig.metafieldConfig.key || 'faq',
        }
      : undefined,
    directItems: blockConfig.directItems || blockConfig.items || [],
    title: blockConfig.title || '',
    subtitle: blockConfig.subtitle || '',
    showTitle: blockConfig.showTitle !== false,
    showSubtitle: blockConfig.showSubtitle !== false,
    titleAlign: blockConfig.titleAlign || 'left',
    showSearch: blockConfig.showSearch || false,
    searchPlaceholder: blockConfig.searchPlaceholder || '搜索问题...',
    iconType: blockConfig.iconType || 'chevron',
    animationDuration: blockConfig.animationDuration || 300,
    enableAnimation: blockConfig.enableAnimation !== false,
  };

  return {
    id: `faq-block-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: 'FAQBlock',
    props: {
      data: faqData,
    },
  };
}
