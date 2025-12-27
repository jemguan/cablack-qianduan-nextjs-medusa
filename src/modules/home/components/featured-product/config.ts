/**
 * FeaturedProduct Block 默认配置
 */

export const DEFAULT_FEATURED_PRODUCT_CONFIG = {
  enabled: true,
  showTitle: true,
  showSubtitle: true,
  titleAlign: 'left' as const,
  layout: 'imageLeft' as const,
  showDescription: true,
  showAllVariants: false,
  showAllImages: false,
  showViewDetails: true,
  viewDetailsText: '查看详情',
  variantsMaxRows: 2,
  variantsExpandText: 'Show More',
  variantsCollapseText: 'Show Less',
} as const;

