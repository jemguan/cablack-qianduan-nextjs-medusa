/**
 * BrandShowcase Block Handler
 * 处理品牌展示块
 */

import type { BrandShowcaseData } from '../../components/brand-showcase/types';
import type { BlockBase, BlockConfig } from './types';
import { generateUniqueId } from './types';

/**
 * 处理 BrandShowcase Block
 */
export function handleBrandShowcaseBlock(
  block: BlockBase,
  blockConfig: Record<string, any>
): BlockConfig | null {
  // 构建 BrandShowcaseData
  const brandShowcaseData: BrandShowcaseData = {
    enabled: blockConfig.enabled !== false,
    title: blockConfig.title || '',
    subtitle: blockConfig.subtitle || '',
    showTitle: blockConfig.showTitle !== false,
    showSubtitle: blockConfig.showSubtitle !== false,
    titleAlign: blockConfig.titleAlign || 'left',
    brands: (blockConfig.brands || []).map((brand: any) => ({
      id: brand.id || generateUniqueId('brand'),
      name: brand.name || '',
      slug: brand.slug,
      image: brand.image || '',
    })),
    desktopCols: blockConfig.desktopCols || 3,
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
    showBrandName: blockConfig.showBrandName !== false,
    imageFit: blockConfig.imageFit || 'contain',
    showViewAllButton: blockConfig.showViewAllButton || false,
    viewAllButtonText: blockConfig.viewAllButtonText || '查看所有品牌',
    viewAllButtonUrl: blockConfig.viewAllButtonUrl || '/brands',
  };

  return {
    id: `brand-showcase-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: 'BrandShowcase',
    props: {
      data: brandShowcaseData,
    },
  };
}
