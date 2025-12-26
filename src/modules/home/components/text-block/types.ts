/**
 * 文字 Block 组件类型定义
 */

/**
 * 单个文字模块数据接口
 */
export interface TextModuleData {
  /** 模块ID */
  id: string;
  /** 标题文本 */
  title?: string;
  /** 标题颜色类名（使用主题颜色系统） */
  titleColor?: string;
  /** 副标题文本 */
  subtitle?: string;
  /** 副标题颜色类名（使用主题颜色系统） */
  subtitleColor?: string;
  /** 段落文本内容 */
  content: string;
  /** 内容模式：text 或 html */
  contentMode?: 'text' | 'html';
  /** 桌面端展开前显示的行数 */
  desktopCollapsedLines?: number;
  /** 移动端展开前显示的行数 */
  mobileCollapsedLines?: number;
  /** 展开按钮文本 */
  expandButtonText?: string;
  /** 收起按钮文本 */
  collapseButtonText?: string;
  /** 桌面端可见性 */
  showOnDesktop?: boolean;
  /** 移动端可见性 */
  showOnMobile?: boolean;
  /** 文本对齐方式 */
  textAlign?: 'left' | 'center' | 'right';
  /** 桌面端占据的行数（网格布局） */
  desktopRows?: number;
  /** 桌面端占据的列数（网格布局） */
  desktopCols?: number;
}

/**
 * 文字 Block 数据接口
 */
export interface TextBlockData {
  /** Block 标题（可选） */
  title?: string;
  /** Block 副标题（可选） */
  subtitle?: string;
  /** 是否显示标题 */
  showTitle?: boolean;
  /** 是否显示副标题 */
  showSubtitle?: boolean;
  /** 标题对齐方式 */
  titleAlign?: 'left' | 'center' | 'right';
  /** 文字模块列表 */
  modules: TextModuleData[];
  /** 网格列数 */
  gridCols?: number;
  /** 网格行数 */
  gridRows?: number;
  /** 网格间距（像素） */
  gridGap?: number;
  /** 移动端网格列数 */
  mobileGridCols?: number;
}

/**
 * 文字 Block Props 接口
 */
export interface TextBlockProps {
  /** 文字 Block 数据 */
  data: TextBlockData;
}

