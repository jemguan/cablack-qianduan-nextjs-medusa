/**
 * CollageHero Block Handler
 * 处理拼贴英雄区块
 */

import type { HttpTypes } from '@medusajs/types';
import type { CollageHeroData, CollageModule } from '../../components/collage-hero/types';
import type { BlockBase, BlockConfig } from './types';
import { generateUniqueId } from './types';

/**
 * 处理图片模块
 */
function processImageModule(module: any): CollageModule {
  return {
    ...module,
    id: module.id || generateUniqueId('module'),
    type: 'image',
    imageUrl: module.imageUrl || '',
    alt: module.alt,
    link: module.link,
    openInNewTab: module.openInNewTab ?? false,
    position: module.position,
    mobilePosition: module.mobilePosition,
    mobileEnabled: module.mobileEnabled ?? true,
    desktopEnabled: module.desktopEnabled ?? true,
  };
}

/**
 * 处理集合模块
 */
function processCollectionModule(module: any): CollageModule {
  return {
    ...module,
    id: module.id || generateUniqueId('module'),
    type: 'collection',
    collectionHandle: module.collectionHandle || '',
    title: module.title,
    imageUrl: module.imageUrl,
    position: module.position,
    mobilePosition: module.mobilePosition,
    mobileEnabled: module.mobileEnabled ?? true,
    desktopEnabled: module.desktopEnabled ?? true,
  };
}

/**
 * 处理视频模块
 */
function processVideoModule(module: any): CollageModule {
  return {
    ...module,
    id: module.id || generateUniqueId('module'),
    type: 'video',
    videoUrl: module.videoUrl || '',
    posterUrl: module.posterUrl,
    autoplay: module.autoplay ?? true,
    loop: module.loop ?? true,
    muted: module.muted ?? true,
    controls: module.controls ?? false,
    position: module.position,
    mobilePosition: module.mobilePosition,
    mobileEnabled: module.mobileEnabled ?? true,
    desktopEnabled: module.desktopEnabled ?? true,
  };
}

/**
 * 处理产品模块
 */
function processProductModule(module: any): CollageModule {
  return {
    ...module,
    id: module.id || generateUniqueId('module'),
    type: 'product',
    productId: module.productId || '',
    position: module.position,
    mobilePosition: module.mobilePosition,
    mobileEnabled: module.mobileEnabled ?? true,
    desktopEnabled: module.desktopEnabled ?? true,
  };
}

/**
 * 处理文本模块
 */
function processTextModule(module: any): CollageModule {
  return {
    ...module,
    id: module.id || generateUniqueId('module'),
    type: 'text',
    title: module.title,
    subtitle: module.subtitle,
    content: module.content,
    textAlign: module.textAlign || 'left',
    titleColor: module.titleColor,
    subtitleColor: module.subtitleColor,
    contentColor: module.contentColor,
    backgroundColor: module.backgroundColor,
    link: module.link,
    openInNewTab: module.openInNewTab ?? false,
    showButton: module.showButton ?? false,
    buttonText: module.buttonText,
    buttonLink: module.buttonLink,
    buttonOpenInNewTab: module.buttonOpenInNewTab ?? false,
    desktopTitleSize: module.desktopTitleSize,
    desktopSubtitleSize: module.desktopSubtitleSize,
    desktopContentSize: module.desktopContentSize,
    mobileTitleSize: module.mobileTitleSize,
    mobileSubtitleSize: module.mobileSubtitleSize,
    mobileContentSize: module.mobileContentSize,
    position: module.position,
    mobilePosition: module.mobilePosition,
    mobileEnabled: module.mobileEnabled ?? true,
    desktopEnabled: module.desktopEnabled ?? true,
    stickyOnHero: module.stickyOnHero,
  };
}

/**
 * 处理模块配置
 */
function processModule(module: any): CollageModule {
  const baseModule = {
    ...module,
    id: module.id || generateUniqueId('module'),
  };

  switch (module.type) {
    case 'image':
      return processImageModule(module);
    case 'collection':
      return processCollectionModule(module);
    case 'video':
      return processVideoModule(module);
    case 'product':
      return processProductModule(module);
    case 'text':
      return processTextModule(module);
    default:
      return baseModule;
  }
}

/**
 * 处理 CollageHero Block
 */
export function handleCollageHeroBlock(
  block: BlockBase,
  blockConfig: Record<string, any>,
  products?: HttpTypes.StoreProduct[],
  region?: HttpTypes.StoreRegion
): BlockConfig | null {
  // 处理模块配置
  const modules = (blockConfig.modules || []).map(processModule);

  // 构建 CollageHeroData
  const collageHeroData: CollageHeroData = {
    enabled: blockConfig.enabled !== false,
    desktopBackgroundImage: blockConfig.desktopBackgroundImage,
    mobileBackgroundImage: blockConfig.mobileBackgroundImage,
    desktopBackgroundVideo: blockConfig.desktopBackgroundVideo,
    mobileBackgroundVideo: blockConfig.mobileBackgroundVideo,
    backgroundImageAlt: blockConfig.backgroundImageAlt,
    backgroundVideoAutoplay: blockConfig.backgroundVideoAutoplay,
    backgroundVideoLoop: blockConfig.backgroundVideoLoop,
    backgroundVideoMuted: blockConfig.backgroundVideoMuted,
    backgroundVideoPoster: blockConfig.backgroundVideoPoster,
    backgroundZIndex: blockConfig.backgroundZIndex ?? -1,
    desktopBlockHeight: blockConfig.desktopBlockHeight || '220vh',
    mobileBlockHeight: blockConfig.mobileBlockHeight || '220vh',
    desktopOverlayStartVh: blockConfig.desktopOverlayStartVh ?? 100,
    desktopOverlayEndVh: blockConfig.desktopOverlayEndVh ?? 180,
    mobileOverlayStartVh: blockConfig.mobileOverlayStartVh ?? 100,
    mobileOverlayEndVh: blockConfig.mobileOverlayEndVh ?? 180,
    desktopBackgroundImageOpacity: blockConfig.desktopBackgroundImageOpacity,
    mobileBackgroundImageOpacity: blockConfig.mobileBackgroundImageOpacity,
    modules,
  };

  // 注入产品数据（如果提供）
  if (products) {
    collageHeroData.products = products;
  }

  return {
    id: `collage-hero-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: 'CollageHero',
    props: {
      containerData: collageHeroData,
      region,
    },
  };
}
