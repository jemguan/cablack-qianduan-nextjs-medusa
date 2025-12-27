import type { BlogPost } from '@lib/data/blogs';

/**
 * 特色博客数据接口
 */
export interface FeaturedBlogData {
  /** 博客文章列表 */
  articles: BlogPost[];
  /** 博客文章 ID 列表（用于筛选） */
  articleIds?: string[];
  /** 最大显示数量 */
  maxCount?: number;
  /** 是否显示查看全部按钮 */
  showViewAll?: boolean;
  /** 查看全部链接 */
  viewAllUrl?: string;
  /** 查看全部按钮文字 */
  viewAllText?: string;

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
  /** 桌面端最大显示数量 */
  desktopMaxCount?: number;
  /** 桌面端超过最大显示数量时自动启用轮播 */
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
  /** 是否启用进入动画 */
  enableAnimation?: boolean;
}

/**
 * 特色博客组件属性
 */
export interface FeaturedBlogProps {
  /** 特色博客数据 */
  containerData: FeaturedBlogData;
  /** 自定义类名 */
  className?: string;
  /** 国家代码（用于生成博客链接） */
  countryCode?: string;
}

