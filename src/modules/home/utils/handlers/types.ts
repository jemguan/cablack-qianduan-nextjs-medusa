/**
 * Block Handlers 通用类型定义
 */

import type { HttpTypes } from '@medusajs/types';

/**
 * Block 基础结构
 */
export interface BlockBase {
  id: string;
  type: string;
  enabled: boolean;
  order: number;
  config: Record<string, any>;
}

/**
 * Block 配置输出结构
 */
export interface BlockConfig {
  id: string;
  type: string;
  enabled: boolean;
  order: number;
  config: Record<string, any>;
  componentName?: string;
  props?: Record<string, any>;
}

/**
 * Block Handler 函数类型（同步）
 */
export type BlockHandler<T = Record<string, any>> = (
  block: BlockBase,
  blockConfig: Record<string, any>,
  ...args: any[]
) => BlockConfig | null;

/**
 * Block Handler 函数类型（异步）
 */
export type AsyncBlockHandler<T = Record<string, any>> = (
  block: BlockBase,
  blockConfig: Record<string, any>,
  ...args: any[]
) => Promise<BlockConfig | null>;

/**
 * 桌面端轮播配置
 */
export interface DesktopCarouselConfig {
  loop: boolean;
  autoplay: boolean;
  autoplayDelay: number;
  spacing: number;
  showNavigation: boolean;
  showPagination: boolean;
  align: string;
  draggable: boolean;
}

/**
 * 移动端轮播配置
 */
export interface MobileCarouselConfig {
  slidesPerView: number;
  spaceBetween: number;
  showNavigation: boolean;
  showPagination: boolean;
  loop: boolean;
  autoplay: boolean;
  autoplayDelay: number;
  align: string;
  draggable: boolean;
}

/**
 * 从配置中提取桌面端轮播配置
 */
export function extractDesktopCarouselConfig(
  blockConfig: Record<string, any>,
  prefix = ''
): DesktopCarouselConfig {
  const config = prefix ? blockConfig[`${prefix}CarouselConfig`] : blockConfig.desktopCarouselConfig;
  return {
    loop: config?.loop || blockConfig[`${prefix}CarouselLoop`] || false,
    autoplay: config?.autoplay || blockConfig[`${prefix}CarouselAutoplay`] || false,
    autoplayDelay: config?.autoplayDelay || blockConfig[`${prefix}CarouselAutoplayDelay`] || 3000,
    spacing: config?.spacing || blockConfig[`${prefix}CarouselSpacing`] || 24,
    showNavigation: config?.showNavigation !== false && blockConfig[`${prefix}CarouselShowNavigation`] !== false,
    showPagination: config?.showPagination !== false && blockConfig[`${prefix}CarouselShowPagination`] !== false,
    align: config?.align || blockConfig[`${prefix}CarouselAlign`] || 'start',
    draggable: config?.draggable !== false && blockConfig[`${prefix}CarouselDraggable`] !== false,
  };
}

/**
 * 从配置中提取移动端轮播配置
 */
export function extractMobileCarouselConfig(
  blockConfig: Record<string, any>,
  prefix = ''
): MobileCarouselConfig {
  const config = prefix ? blockConfig[`${prefix}CarouselConfig`] : blockConfig.mobileCarouselConfig;
  return {
    slidesPerView: config?.slidesPerView || blockConfig[`${prefix}CarouselSlidesPerView`] || 1.5,
    spaceBetween: config?.spaceBetween || blockConfig[`${prefix}CarouselSpacing`] || 16,
    showNavigation: config?.showNavigation || blockConfig[`${prefix}CarouselShowNavigation`] || false,
    showPagination: config?.showPagination !== false && blockConfig[`${prefix}CarouselShowPagination`] !== false,
    loop: config?.loop || blockConfig[`${prefix}CarouselLoop`] || false,
    autoplay: config?.autoplay || blockConfig[`${prefix}CarouselAutoplay`] || false,
    autoplayDelay: config?.autoplayDelay || blockConfig[`${prefix}CarouselAutoplayDelay`] || 3000,
    align: config?.align || blockConfig[`${prefix}CarouselAlign`] || 'start',
    draggable: config?.draggable !== false && blockConfig[`${prefix}CarouselDraggable`] !== false,
  };
}

/**
 * 生成唯一 ID
 */
export function generateUniqueId(prefix = 'module'): string {
  return `${prefix}-${Date.now()}-${Math.random()}`;
}

/**
 * 安全解析整数
 */
export function safeParseInt(value: any, defaultValue: number): number {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  if (typeof value === 'number') {
    return value;
  }
  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? defaultValue : parsed;
}
