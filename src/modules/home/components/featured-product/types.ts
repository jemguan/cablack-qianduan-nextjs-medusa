import type { HttpTypes } from '@medusajs/types';

/**
 * 特色产品配置接口
 */
export interface FeaturedProductConfig {
  /** 是否启用 */
  enabled?: boolean;
  /** 产品 ID */
  productId?: string;
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
  /** 布局方式：图片位置 */
  layout?: 'imageLeft' | 'imageRight';
  /** 是否显示产品描述 */
  showDescription?: boolean;
  /** 是否显示所有变体选项 */
  showAllVariants?: boolean;
  /** 是否显示所有产品图片 */
  showAllImages?: boolean;
  /** 是否显示查看详情按钮 */
  showViewDetails?: boolean;
  /** 查看详情按钮文字 */
  viewDetailsText?: string;
  /** 变体选项最大显示行数（超过此行数将折叠显示） */
  variantsMaxRows?: number;
  /** 展开按钮文字 */
  variantsExpandText?: string;
  /** 收起按钮文字 */
  variantsCollapseText?: string;
}

/**
 * FeaturedProduct Block 的数据接口
 */
export interface FeaturedProductData extends FeaturedProductConfig {
  /** 产品数据 */
  product?: HttpTypes.StoreProduct;
}

/**
 * FeaturedProduct Block 组件的属性接口
 */
export interface FeaturedProductProps {
  /** Block 数据 */
  containerData: FeaturedProductData;
  /** 自定义 CSS 类名 */
  className?: string;
  /** 区域信息 */
  region: HttpTypes.StoreRegion;
  /** 国家代码 */
  countryCode?: string;
}

