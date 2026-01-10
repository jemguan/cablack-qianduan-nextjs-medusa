/**
 * Banner Block 组件类型定义
 */

/**
 * 单个 Banner 模块数据接口
 */
export interface BannerModuleData {
  /** 模块ID */
  id: string;
  /** 图片 URL */
  image?: string;
  /** 链接 URL（整个 banner 可点击） */
  link?: string;
  /** 链接打开方式 */
  linkTarget?: '_self' | '_blank';
  /** 桌面端可见性 */
  showOnDesktop?: boolean;
  /** 移动端可见性 */
  showOnMobile?: boolean;
  /** 桌面端占据的列数（网格布局） */
  desktopCols?: number;
  /** 桌面端占据的行数（网格布局），用于实现"左一右二"等布局 */
  rowSpan?: number;
}

/**
 * Banner Block 数据接口
 */
export interface BannerBlockData {
  /** Banner 模块列表 */
  modules: BannerModuleData[];
  /** 网格列数 */
  gridCols?: number;
  /** 网格间距（像素） */
  gridGap?: number;
  /** 移动端网格列数 */
  mobileGridCols?: number;
  /** 桌面端是否全宽显示 */
  fullWidth?: boolean;
}

/**
 * Banner Block Props 接口
 */
export interface BannerBlockProps {
  /** Banner Block 数据 */
  data: BannerBlockData;
}
