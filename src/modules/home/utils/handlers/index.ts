/**
 * Block Handlers 统一入口
 * 导出所有 block handler 函数和类型
 */

// 类型导出
export type {
  BlockBase,
  BlockConfig,
  BlockHandler,
  AsyncBlockHandler,
  DesktopCarouselConfig,
  MobileCarouselConfig,
} from './types';

// 工具函数导出
export {
  extractDesktopCarouselConfig,
  extractMobileCarouselConfig,
  generateUniqueId,
  safeParseInt,
} from './types';

// Handler 函数导出
export { handleFeaturedCollectionsBlock } from './featuredCollections';
export { handleCollageHeroBlock } from './collageHero';
export { handleBrandShowcaseBlock } from './brandShowcase';
export { handleTextBlockBlock } from './textBlock';
export { handleFAQBlock } from './faq';
export { handleFeaturedBlogBlock } from './featuredBlog';
export { handleFeaturedProductBlock } from './featuredProduct';
export { handleBannerBlockBlock } from './bannerBlock';
