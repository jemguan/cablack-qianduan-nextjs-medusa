import type { TextBlockData } from './types';

/**
 * 文字 Block 配置常量
 */

/**
 * 默认配置
 */
export const DEFAULT_TEXT_BLOCK_CONFIG = {
  /** 默认标题颜色 */
  titleColor: 'text-foreground',
  /** 默认副标题颜色 */
  subtitleColor: 'text-muted-foreground',
  /** 默认桌面端折叠行数 */
  desktopCollapsedLines: 3,
  /** 默认移动端折叠行数 */
  mobileCollapsedLines: 3,
  /** 默认展开按钮文本 */
  expandButtonText: 'Read More',
  /** 默认收起按钮文本 */
  collapseButtonText: 'Show Less',
  /** 默认桌面端可见 */
  showOnDesktop: true,
  /** 默认移动端可见 */
  showOnMobile: true,
  /** 默认文本对齐 */
  textAlign: 'left' as const,
  /** 默认桌面端占据行数 */
  desktopRows: 1,
  /** 默认桌面端占据列数 */
  desktopCols: 1,
  /** 默认网格行数 */
  gridRows: 1,
  /** 默认网格列数 */
  gridCols: 1,
  /** 默认网格间距 */
  gridGap: 24,
  /** 默认移动端网格列数 */
  mobileGridCols: 1,
} as const;

/**
 * 默认 TextBlock 数据配置
 */
export const DEFAULT_TEXT_BLOCK_DATA: Partial<TextBlockData> = {
  showTitle: true,
  showSubtitle: true,
  titleAlign: 'left',
  gridCols: 1,
  gridRows: 1,
  gridGap: 24,
  mobileGridCols: 1,
  modules: [],
};

