/**
 * FeaturedBlog Block Handler
 * 处理精选博客块
 */

import type { FeaturedBlogData } from '../../components/featured-blog/types';
import type { BlogPost } from '@lib/data/blogs';
import type { BlockBase, BlockConfig } from './types';

/**
 * 处理 FeaturedBlog Block
 */
export function handleFeaturedBlogBlock(
  block: BlockBase,
  blockConfig: Record<string, any>,
  articles?: BlogPost[]
): BlockConfig | null {
  // 构建 FeaturedBlogData
  const featuredBlogData: FeaturedBlogData = {
    articles: articles || [],
    articleIds: blockConfig.articleIds || [],
    maxCount: blockConfig.maxCount || 6,
    showViewAll: blockConfig.showViewAll !== false,
    viewAllUrl: blockConfig.viewAllUrl || '/blogs',
    viewAllText: blockConfig.viewAllText || 'View All Articles',
    title: blockConfig.title || '',
    subtitle: blockConfig.subtitle || '',
    showTitle: blockConfig.showTitle !== false,
    showSubtitle: blockConfig.showSubtitle !== false,
    titleAlign: blockConfig.titleAlign || 'left',
    // 桌面端配置
    desktopCols: blockConfig.desktopCols || 3,
    desktopMaxCount: blockConfig.desktopMaxCount,
    desktopEnableCarousel: blockConfig.desktopEnableCarousel || false,
    desktopCarouselConfig: {
      loop: blockConfig.desktopCarouselConfig?.loop || false,
      autoplay: blockConfig.desktopCarouselConfig?.autoplay || false,
      autoplayDelay: blockConfig.desktopCarouselConfig?.autoplayDelay || 3000,
      spacing: blockConfig.desktopCarouselConfig?.spacing || 24,
      showNavigation: blockConfig.desktopCarouselConfig?.showNavigation !== false,
      showPagination: blockConfig.desktopCarouselConfig?.showPagination !== false,
      align: blockConfig.desktopCarouselConfig?.align || 'start',
      draggable: blockConfig.desktopCarouselConfig?.draggable !== false,
    },
    // 移动端配置
    mobileLayout: blockConfig.mobileLayout || 'carousel',
    mobileCols: blockConfig.mobileCols || 2,
    mobileCarouselConfig: {
      slidesPerView: blockConfig.mobileCarouselConfig?.slidesPerView || 1.5,
      spaceBetween: blockConfig.mobileCarouselConfig?.spaceBetween || 16,
      showNavigation: blockConfig.mobileCarouselConfig?.showNavigation || false,
      showPagination: blockConfig.mobileCarouselConfig?.showPagination !== false,
      loop: blockConfig.mobileCarouselConfig?.loop || false,
      autoplay: blockConfig.mobileCarouselConfig?.autoplay || false,
      autoplayDelay: blockConfig.mobileCarouselConfig?.autoplayDelay || 3000,
      align: blockConfig.mobileCarouselConfig?.align || 'start',
      draggable: blockConfig.mobileCarouselConfig?.draggable !== false,
    },
    enableAnimation: blockConfig.enableAnimation !== false,
  };

  return {
    id: `featured-blog-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: 'FeaturedBlog',
    props: {
      containerData: featuredBlogData,
    },
  };
}
