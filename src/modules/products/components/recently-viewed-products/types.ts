import type { HttpTypes } from '@medusajs/types';

/**
 * 最近浏览产品 Block 数据配置接口
 */
export interface RecentlyViewedProductsData {
  /** 是否启用 */
  enabled?: boolean;
  /** 产品数量限制，最大20个 */
  limit?: number;
  /** 当前产品ID，用于从浏览历史中排除 */
  currentProductId?: string;
  /** 布局模式（已废弃，使用 desktopEnableCarousel 和 mobileLayout） */
  layout?: 'grid' | 'carousel';
  /** 智能布局阈值（已废弃，使用 desktopMaxCount） */
  maxCount?: number;
  /** 网格列数配置（已废弃，使用 desktopCols 和 mobileCols） */
  gridCols?: {
    base?: number;
    md?: number;
    lg?: number;
  };
  /** 桌面端配置 */
  desktopCols?: number;
  desktopMaxCount?: number;
  desktopEnableCarousel?: boolean;
  desktopCarouselLoop?: boolean;
  desktopCarouselAutoplay?: boolean;
  desktopCarouselAutoplayDelay?: number;
  desktopCarouselSpacing?: number;
  desktopCarouselShowNavigation?: boolean;
  desktopCarouselShowPagination?: boolean;
  desktopCarouselAlign?: 'start' | 'center' | 'end';
  desktopCarouselDraggable?: boolean;
  /** 移动端配置 */
  mobileLayout?: 'carousel' | 'grid';
  mobileCols?: number;
  mobileCarouselSlidesPerView?: number;
  mobileCarouselLoop?: boolean;
  mobileCarouselAutoplay?: boolean;
  mobileCarouselAutoplayDelay?: number;
  mobileCarouselSpacing?: number;
  mobileCarouselShowNavigation?: boolean;
  mobileCarouselShowPagination?: boolean;
  mobileCarouselAlign?: 'start' | 'center' | 'end';
  mobileCarouselDraggable?: boolean;
  /** 标题和副标题配置 */
  title?: string;
  subtitle?: string;
  showTitle?: boolean;
  showSubtitle?: boolean;
  titleAlign?: 'left' | 'center' | 'right';
}

/**
 * 最近浏览产品 Block 组件属性
 */
export interface RecentlyViewedProductsBlockProps {
  /** Block 数据 */
  data: RecentlyViewedProductsData;
  /** 区域信息 */
  region: HttpTypes.StoreRegion;
  /** 国家代码 */
  countryCode?: string;
}

/**
 * 浏览历史中的产品数据
 */
export interface ViewedProduct {
  /** 产品ID */
  id: string;
  /** 产品标题 */
  title: string;
  /** 产品句柄 */
  handle: string;
  /** 产品供应商 */
  vendor?: string;
  /** 产品图片URL */
  imageUrl?: string;
  /** 产品图片alt文本 */
  imageAlt?: string;
  /** 产品价格 */
  price?: {
    amount: string;
    currencyCode: string;
  };
  /** 产品对比价格（原价） */
  compareAtPrice?: {
    amount: string;
    currencyCode: string;
  } | null;
  /** 浏览时间戳 */
  viewedAt: number;
}

/**
 * localStorage中存储的浏览历史数据结构
 */
export interface ViewingHistory {
  /** 浏览过的产品列表 */
  products: ViewedProduct[];
  /** 最后更新时间 */
  lastUpdated: number;
}

