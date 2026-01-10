import type { BannerBlockData } from './types';

/**
 * Banner Block 配置常量
 */

/**
 * 默认配置
 */
export const DEFAULT_BANNER_BLOCK_CONFIG = {
  /** 默认桌面端可见 */
  showOnDesktop: true,
  /** 默认移动端可见 */
  showOnMobile: true,
  /** 默认桌面端占据列数 */
  desktopCols: 1,
  /** 默认网格列数 */
  gridCols: 1,
  /** 默认网格间距 */
  gridGap: 24,
  /** 默认移动端网格列数 */
  mobileGridCols: 1,
} as const;

/**
 * 默认 BannerBlock 数据配置
 */
export const DEFAULT_BANNER_BLOCK_DATA: Partial<BannerBlockData> = {
  gridCols: 1,
  gridGap: 24,
  mobileGridCols: 1,
  fullWidth: false,
  modules: [],
};
