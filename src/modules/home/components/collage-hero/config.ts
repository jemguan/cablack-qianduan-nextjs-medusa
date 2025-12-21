/**
 * CollageHero Block 的配置常量
 */

import type {CollageHeroData} from './types';

/**
 * 默认配置
 */
export const DEFAULT_COLLAGE_HERO_CONFIG: Partial<CollageHeroData> = {
  // 默认启用 CollageHero
  enabled: true,
  // 背景层默认 z-index 为 -1，确保在 Header (z-10) 和 AnnouncementBar 之下
  backgroundZIndex: -1,
  backgroundImageAlt: 'Collage Hero Background',
};

/**
 * 默认模块配置
 */
export const DEFAULT_MODULE_CONFIG = {
  image: {
    openInNewTab: false,
  },
  video: {
    autoplay: true,
    loop: true,
    muted: true,
    controls: false,
  },
};

