/**
 * 品牌数据接口
 */
export interface Brand {
  /** 品牌唯一标识 */
  id: string;
  /** 品牌名称 */
  name: string;
  /** 品牌 slug（用于路由） */
  slug?: string;
  /** 品牌图片 URL */
  image: string;
}

/**
 * 品牌展示区块数据接口
 */
export interface BrandShowcaseData {
  /** 是否启用此区块 */
  enabled?: boolean;
  /** 要展示的品牌列表 */
  brands: Brand[];

  /** Block 标题 */
  title?: string;
  /** Block 副标题 */
  subtitle?: string;
  /** 是否显示标题 */
  showTitle?: boolean;
  /** 是否显示副标题 */
  showSubtitle?: boolean;
  /** 标题对齐方式 */
  titleAlign?: 'left' | 'center' | 'right';

  // 桌面端配置
  /** 桌面端一行显示几个元素 */
  desktopCols?: number;
  /** 桌面端是否启用轮播 */
  desktopEnableCarousel?: boolean;
  /** 桌面端轮播配置 */
  desktopCarouselConfig?: {
    loop?: boolean;
    autoplay?: boolean;
    autoplayDelay?: number;
    spacing?: number;
    showNavigation?: boolean;
    showPagination?: boolean;
    align?: 'start' | 'center' | 'end';
    draggable?: boolean;
  };

  // 移动端配置
  /** 移动端布局样式 */
  mobileLayout?: 'grid' | 'carousel';
  /** 移动端网格布局列数 */
  mobileCols?: number;
  /** 移动端轮播配置 */
  mobileCarouselConfig?: {
    slidesPerView?: number;
    spaceBetween?: number;
    showNavigation?: boolean;
    showPagination?: boolean;
    loop?: boolean;
    autoplay?: boolean;
    autoplayDelay?: number;
    align?: 'start' | 'center' | 'end';
    draggable?: boolean;
  };

  /** 是否显示品牌名称 */
  showBrandName?: boolean;
  /** 图片适应方式 */
  imageFit?: 'cover' | 'contain';
  /** 是否显示查看所有品牌按钮 */
  showViewAllButton?: boolean;
  /** 查看所有品牌按钮文字 */
  viewAllButtonText?: string;
  /** 查看所有品牌按钮 URL */
  viewAllButtonUrl?: string;
}

