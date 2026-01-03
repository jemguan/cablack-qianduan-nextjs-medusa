/**
 * CollageHero Block 的数据类型定义
 */

import type { HttpTypes } from '@medusajs/types';

/**
 * 图片模块配置
 */
export interface ImageModule {
  /** 模块 ID */
  id: string;
  /** 类型标识 */
  type: 'image';
  /** 图片 URL */
  imageUrl: string;
  /** 图片替代文本 */
  alt?: string;
  /** 点击后跳转的链接 */
  link?: string;
  /** 是否在新标签页打开 */
  openInNewTab?: boolean;
  /** 桌面端位置配置 */
  position?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    width?: string;
    height?: string;
    transform?: string;
  };
  /** 移动端位置配置 */
  mobilePosition?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    width?: string;
    height?: string;
    transform?: string;
  };
  /** 是否在移动端显示（默认 true） */
  mobileEnabled?: boolean;
  /** 是否在桌面端显示（默认 true） */
  desktopEnabled?: boolean;
}

/**
 * 产品系列模块配置
 */
export interface CollectionModule {
  /** 模块 ID */
  id: string;
  /** 类型标识 */
  type: 'collection';
  /** 产品系列 Handle（用于生成链接） */
  collectionHandle: string;
  /** 产品系列标题（可选，如果不提供则使用 Medusa 数据） */
  title?: string;
  /** 产品系列图片 URL（可选） */
  imageUrl?: string;
  /** 桌面端位置配置 */
  position?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    width?: string;
    height?: string;
    transform?: string;
  };
  /** 移动端位置配置 */
  mobilePosition?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    width?: string;
    height?: string;
    transform?: string;
  };
  /** 是否在移动端显示（默认 true） */
  mobileEnabled?: boolean;
  /** 是否在桌面端显示（默认 true） */
  desktopEnabled?: boolean;
}

/**
 * 视频模块配置
 */
export interface VideoModule {
  /** 模块 ID */
  id: string;
  /** 类型标识 */
  type: 'video';
  /** 视频 URL */
  videoUrl: string;
  /** 视频封面图 URL */
  posterUrl?: string;
  /** 是否自动播放 */
  autoplay?: boolean;
  /** 是否循环播放 */
  loop?: boolean;
  /** 是否静音 */
  muted?: boolean;
  /** 是否显示控制条 */
  controls?: boolean;
  /** 桌面端位置配置 */
  position?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    width?: string;
    height?: string;
    transform?: string;
  };
  /** 移动端位置配置 */
  mobilePosition?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    width?: string;
    height?: string;
    transform?: string;
  };
  /** 是否在移动端显示（默认 true） */
  mobileEnabled?: boolean;
  /** 是否在桌面端显示（默认 true） */
  desktopEnabled?: boolean;
}

/**
 * 主推产品模块配置
 */
export interface ProductModule {
  /** 模块 ID */
  id: string;
  /** 类型标识 */
  type: 'product';
  /** 产品 ID（Medusa 产品 ID） */
  productId: string;
  /** 桌面端位置配置 */
  position?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    width?: string;
    height?: string;
    transform?: string;
  };
  /** 移动端位置配置 */
  mobilePosition?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    width?: string;
    height?: string;
    transform?: string;
  };
  /** 是否在移动端显示（默认 true） */
  mobileEnabled?: boolean;
  /** 是否在桌面端显示（默认 true） */
  desktopEnabled?: boolean;
}

/**
 * 文字模块配置
 */
export interface TextModule {
  /** 模块 ID */
  id: string;
  /** 类型标识 */
  type: 'text';
  /** 标题 */
  title?: string;
  /** 副标题 */
  subtitle?: string;
  /** 正文内容 */
  content?: string;
  /** 文字对齐方式 */
  textAlign?: 'left' | 'center' | 'right';
  /** 标题颜色类名 */
  titleColor?: string;
  /** 副标题颜色类名 */
  subtitleColor?: string;
  /** 正文颜色类名 */
  contentColor?: string;
  /** 背景颜色类名（已弃用，默认无背景） */
  backgroundColor?: string;
  /** 点击后跳转的链接 */
  link?: string;
  /** 是否在新标签页打开 */
  openInNewTab?: boolean;
  /** 是否显示按钮 */
  showButton?: boolean;
  /** 按钮文字 */
  buttonText?: string;
  /** 按钮跳转链接 */
  buttonLink?: string;
  /** 按钮是否在新标签页打开 */
  buttonOpenInNewTab?: boolean;
  /** 桌面端字体大小 */
  desktopTitleSize?: string;
  desktopSubtitleSize?: string;
  desktopContentSize?: string;
  /** 移动端字体大小 */
  mobileTitleSize?: string;
  mobileSubtitleSize?: string;
  mobileContentSize?: string;
  /** 桌面端位置配置 */
  position?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    width?: string;
    height?: string;
    transform?: string;
  };
  /** 移动端位置配置 */
  mobilePosition?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    width?: string;
    height?: string;
    transform?: string;
  };
  /** 是否在移动端显示（默认 true） */
  mobileEnabled?: boolean;
  /** 是否在桌面端显示（默认 true） */
  desktopEnabled?: boolean;
  /** 是否固定在首屏（使用 fixed 定位，不随 block 滚动，默认 true） */
  stickyOnHero?: boolean;
}

/**
 * 模块联合类型
 */
export type CollageModule =
  | ImageModule
  | CollectionModule
  | VideoModule
  | ProductModule
  | TextModule;

/**
 * CollageHero Block 的数据接口
 */
export interface CollageHeroData {
  /** 是否启用 CollageHero（默认 true） */
  enabled?: boolean;
  /** 桌面端背景图片 URL */
  desktopBackgroundImage?: string;
  /** 移动端背景图片 URL */
  mobileBackgroundImage?: string;
  /** 桌面端背景视频 URL */
  desktopBackgroundVideo?: string;
  /** 移动端背景视频 URL */
  mobileBackgroundVideo?: string;
  /** 背景图片替代文本 */
  backgroundImageAlt?: string;
  /** 背景视频是否自动播放 */
  backgroundVideoAutoplay?: boolean;
  /** 背景视频是否循环播放 */
  backgroundVideoLoop?: boolean;
  /** 背景视频是否静音 */
  backgroundVideoMuted?: boolean;
  /** 背景视频封面图 URL */
  backgroundVideoPoster?: string;
  /** 模块列表 */
  modules: CollageModule[];
  /** 背景图片的 z-index（滚动时层级） */
  backgroundZIndex?: number;
  /** Block 容器高度（桌面端），例如 '220vh'、'300vh' 等 */
  desktopBlockHeight?: string;
  /** Block 容器高度（移动端），例如 '220vh'、'300vh' 等 */
  mobileBlockHeight?: string;
  /** 桌面端遮罩开始显示的 vh 值（默认 100，即 100vh） */
  desktopOverlayStartVh?: number;
  /** 桌面端遮罩完全显示的 vh 值（默认 180，即 180vh） */
  desktopOverlayEndVh?: number;
  /** 移动端遮罩开始显示的 vh 值（默认 100，即 100vh） */
  mobileOverlayStartVh?: number;
  /** 移动端遮罩完全显示的 vh 值（默认 180，即 180vh） */
  mobileOverlayEndVh?: number;
  /** 桌面端背景图片透明度（0-1，默认 1） */
  desktopBackgroundImageOpacity?: number;
  /** 移动端背景图片透明度（0-1，默认 1） */
  mobileBackgroundImageOpacity?: number;
  /** 产品数据（用于产品模块） */
  products?: HttpTypes.StoreProduct[];
}

/**
 * CollageHero Block 组件的属性接口
 */
export interface CollageHeroBlockProps {
  /** Block 数据 */
  containerData: CollageHeroData;
  /** 自定义 CSS 类名 */
  className?: string;
}

