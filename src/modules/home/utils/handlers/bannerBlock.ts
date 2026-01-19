/**
 * BannerBlock Block Handler
 * 处理横幅块
 */

import type { BannerBlockData } from '../../components/banner-block/types';
import type { BlockBase, BlockConfig } from './types';
import { generateUniqueId, safeParseInt } from './types';

/**
 * 处理图片 URL，兼容旧的 object 格式
 */
function processImageUrl(image: any): string {
  if (typeof image === 'string') {
    return image;
  }
  if (image?.desktop) {
    return image.desktop;
  }
  return '';
}

/**
 * 处理 BannerBlock Block
 */
export function handleBannerBlockBlock(
  block: BlockBase,
  blockConfig: Record<string, any>
): BlockConfig | null {
  // 构建 BannerBlockData
  const bannerBlockData: BannerBlockData = {
    modules: (blockConfig.modules || []).map((module: any) => ({
      id: module.id || generateUniqueId('module'),
      image: processImageUrl(module.image),
      link: module.link,
      linkTarget: module.linkTarget || '_self',
      showOnDesktop: module.showOnDesktop !== false,
      showOnMobile: module.showOnMobile !== false,
      desktopCols: safeParseInt(module.desktopCols, 1),
      rowSpan: safeParseInt(module.rowSpan, 1),
    })),
    gridCols: safeParseInt(blockConfig.gridCols, 1),
    gridGap: safeParseInt(blockConfig.gridGap, 24),
    mobileGridCols: safeParseInt(blockConfig.mobileGridCols, 1),
    fullWidth: blockConfig.fullWidth === true,
  };

  return {
    id: `banner-block-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: 'BannerBlock',
    props: {
      data: bannerBlockData,
    },
  };
}
