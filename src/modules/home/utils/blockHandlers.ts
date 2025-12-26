/**
 * Block Handlers
 * 处理不同类型的 block 配置
 */

import type { HttpTypes } from '@medusajs/types';
import type { BlockConfig } from './getPageLayoutBlocks';
import type { CollageHeroData } from '../components/collage-hero/types';
import type { BrandShowcaseData } from '../components/brand-showcase/types';
import type { TextBlockData } from '../components/text-block/types';
import type { FAQData } from '../components/faq-block/types';

/**
 * 处理 FeaturedCollections Block
 */
export function handleFeaturedCollectionsBlock(
  block: {
    id: string;
    type: string;
    enabled: boolean;
    order: number;
    config: Record<string, any>;
  },
  blockConfig: Record<string, any>,
  collections: HttpTypes.StoreCollection[],
  region: HttpTypes.StoreRegion
): BlockConfig | null {
  // 从配置中获取要显示的集合 ID 列表（只取第一个）
  const collectionIds = blockConfig.collectionIds || [];
  const collectionId = collectionIds[0];

  // 如果没有配置集合 ID，返回 null（不显示）
  if (!collectionId) {
    return null;
  }

  // 根据 collectionId 查找集合
  const featuredCollection = collections.find(c => c.id === collectionId);

  // 如果没有找到集合，返回 null
  if (!featuredCollection) {
    return null;
  }

  // 从配置中读取其他设置
  const title = blockConfig.title || '';
  const subtitle = blockConfig.subtitle || '';
  const showTitle = blockConfig.showTitle !== false;
  const showSubtitle = blockConfig.showSubtitle !== false;
  const titleAlign = blockConfig.titleAlign || 'left';
  const maxCount = blockConfig.maxCount || 6; // 默认显示 6 个产品
  const desktopCols = blockConfig.desktopCols || 3; // 默认桌面端 3 列
  const mobileCols = blockConfig.mobileCols || 2; // 默认移动端 2 列

  return {
    id: `featured-collections-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: 'FeaturedCollections',
    props: {
      collection: featuredCollection, // 传递单个集合
      region,
      title,
      subtitle,
      showTitle,
      showSubtitle,
      titleAlign,
      maxCount, // 传递 maxCount 用于限制产品数量
      desktopCols, // 传递桌面端列数
      mobileCols, // 传递移动端列数
    },
  };
}

/**
 * 处理 CollageHero Block
 */
export function handleCollageHeroBlock(
  block: {
    id: string;
    type: string;
    enabled: boolean;
    order: number;
    config: Record<string, any>;
  },
  blockConfig: Record<string, any>,
  products?: HttpTypes.StoreProduct[],
  region?: HttpTypes.StoreRegion
): BlockConfig | null {
  // 处理模块配置，确保所有字段正确
  const modules = (blockConfig.modules || []).map((module: any) => {
    const baseModule = {
      ...module,
      id: module.id || `module-${Date.now()}-${Math.random()}`,
    };

    // 根据模块类型确保字段正确
    switch (module.type) {
      case 'image':
        return {
          ...baseModule,
          imageUrl: baseModule.imageUrl || '',
          alt: baseModule.alt,
          link: baseModule.link,
          openInNewTab: baseModule.openInNewTab ?? false,
          position: baseModule.position,
          mobilePosition: baseModule.mobilePosition,
          mobileEnabled: baseModule.mobileEnabled ?? true,
          desktopEnabled: baseModule.desktopEnabled ?? true,
        };
      case 'collection':
        return {
          ...baseModule,
          collectionHandle: baseModule.collectionHandle || '',
          title: baseModule.title,
          imageUrl: baseModule.imageUrl,
          position: baseModule.position,
          mobilePosition: baseModule.mobilePosition,
          mobileEnabled: baseModule.mobileEnabled ?? true,
          desktopEnabled: baseModule.desktopEnabled ?? true,
        };
      case 'video':
        return {
          ...baseModule,
          videoUrl: baseModule.videoUrl || '',
          posterUrl: baseModule.posterUrl,
          autoplay: baseModule.autoplay ?? true,
          loop: baseModule.loop ?? true,
          muted: baseModule.muted ?? true,
          controls: baseModule.controls ?? false,
          position: baseModule.position,
          mobilePosition: baseModule.mobilePosition,
          mobileEnabled: baseModule.mobileEnabled ?? true,
          desktopEnabled: baseModule.desktopEnabled ?? true,
        };
      case 'product':
        return {
          ...baseModule,
          productId: baseModule.productId || '',
          position: baseModule.position,
          mobilePosition: baseModule.mobilePosition,
          mobileEnabled: baseModule.mobileEnabled ?? true,
          desktopEnabled: baseModule.desktopEnabled ?? true,
        };
      case 'text':
        return {
          ...baseModule,
          title: baseModule.title,
          subtitle: baseModule.subtitle,
          content: baseModule.content,
          textAlign: baseModule.textAlign || 'left',
          titleColor: baseModule.titleColor,
          subtitleColor: baseModule.subtitleColor,
          contentColor: baseModule.contentColor,
          backgroundColor: baseModule.backgroundColor,
          link: baseModule.link,
          openInNewTab: baseModule.openInNewTab ?? false,
          showButton: baseModule.showButton ?? false,
          buttonText: baseModule.buttonText,
          buttonLink: baseModule.buttonLink,
          buttonOpenInNewTab: baseModule.buttonOpenInNewTab ?? false,
          desktopTitleSize: baseModule.desktopTitleSize,
          desktopSubtitleSize: baseModule.desktopSubtitleSize,
          desktopContentSize: baseModule.desktopContentSize,
          mobileTitleSize: baseModule.mobileTitleSize,
          mobileSubtitleSize: baseModule.mobileSubtitleSize,
          mobileContentSize: baseModule.mobileContentSize,
          position: baseModule.position,
          mobilePosition: baseModule.mobilePosition,
          mobileEnabled: baseModule.mobileEnabled ?? true,
          desktopEnabled: baseModule.desktopEnabled ?? true,
          stickyOnHero: baseModule.stickyOnHero,
        };
      default:
        return baseModule;
    }
  });

  // 构建 CollageHeroData
  const collageHeroData: CollageHeroData = {
    enabled: blockConfig.enabled !== false,
    desktopBackgroundImage: blockConfig.desktopBackgroundImage,
    mobileBackgroundImage: blockConfig.mobileBackgroundImage,
    desktopBackgroundVideo: blockConfig.desktopBackgroundVideo,
    mobileBackgroundVideo: blockConfig.mobileBackgroundVideo,
    backgroundImageAlt: blockConfig.backgroundImageAlt,
    backgroundVideoAutoplay: blockConfig.backgroundVideoAutoplay,
    backgroundVideoLoop: blockConfig.backgroundVideoLoop,
    backgroundVideoMuted: blockConfig.backgroundVideoMuted,
    backgroundVideoPoster: blockConfig.backgroundVideoPoster,
    backgroundZIndex: blockConfig.backgroundZIndex ?? -1,
    desktopBlockHeight: blockConfig.desktopBlockHeight || '220vh',
    mobileBlockHeight: blockConfig.mobileBlockHeight || '220vh',
    desktopOverlayStartVh: blockConfig.desktopOverlayStartVh ?? 100,
    desktopOverlayEndVh: blockConfig.desktopOverlayEndVh ?? 180,
    mobileOverlayStartVh: blockConfig.mobileOverlayStartVh ?? 100,
    mobileOverlayEndVh: blockConfig.mobileOverlayEndVh ?? 180,
    modules,
  };

  // 注入产品数据（如果提供）
  if (products) {
    collageHeroData.products = products;
  }

  return {
    id: `collage-hero-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: 'CollageHero',
    props: {
      containerData: collageHeroData,
      region,
    },
  };
}

/**
 * 处理 BrandShowcase Block
 */
export function handleBrandShowcaseBlock(
  block: {
    id: string;
    type: string;
    enabled: boolean;
    order: number;
    config: Record<string, any>;
  },
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
      id: brand.id || `brand-${Date.now()}-${Math.random()}`,
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

/**
 * 处理 TextBlock Block
 */
export function handleTextBlockBlock(
  block: {
    id: string;
    type: string;
    enabled: boolean;
    order: number;
    config: Record<string, any>;
  },
  blockConfig: Record<string, any>
): BlockConfig | null {
  // 构建 TextBlockData
  const textBlockData: TextBlockData = {
    title: blockConfig.title || '',
    subtitle: blockConfig.subtitle || '',
    showTitle: blockConfig.showTitle !== false,
    showSubtitle: blockConfig.showSubtitle !== false,
    titleAlign: blockConfig.titleAlign || 'left',
    modules: (blockConfig.modules || []).map((module: any) => ({
      id: module.id || `module-${Date.now()}-${Math.random()}`,
      title: module.title,
      titleColor: module.titleColor,
      subtitle: module.subtitle,
      subtitleColor: module.subtitleColor,
      content: module.content || '',
      contentMode: module.contentMode || 'text',
      desktopCollapsedLines: module.desktopCollapsedLines ?? 3,
      mobileCollapsedLines: module.mobileCollapsedLines ?? 3,
      expandButtonText: module.expandButtonText || 'Read More',
      collapseButtonText: module.collapseButtonText || 'Show Less',
      showOnDesktop: module.showOnDesktop !== false,
      showOnMobile: module.showOnMobile !== false,
      textAlign: module.textAlign || 'left',
      desktopRows: module.desktopRows ?? 1,
      desktopCols: module.desktopCols ?? 1,
    })),
    gridCols: blockConfig.gridCols ?? 1,
    gridRows: blockConfig.gridRows ?? 1,
    gridGap: blockConfig.gridGap ?? 24,
    mobileGridCols: blockConfig.mobileGridCols ?? 1,
  };

  return {
    id: `text-block-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: 'TextBlock',
    props: {
      data: textBlockData,
    },
  };
}

/**
 * 处理 FAQ Block
 */
export function handleFAQBlock(
  block: {
    id: string;
    type: string;
    enabled: boolean;
    order: number;
    config: Record<string, any>;
  },
  blockConfig: Record<string, any>
): BlockConfig | null {
  // 构建 FAQData
  const faqData: FAQData = {
    items: blockConfig.items || [],
    defaultOpenFirst: blockConfig.defaultOpenFirst || false,
    allowMultiple: blockConfig.allowMultiple || false,
    theme: blockConfig.theme || 'default',
    dataMode: blockConfig.dataMode || 'direct',
    metafieldConfig: blockConfig.metafieldConfig
      ? {
          key: blockConfig.metafieldConfig.key || 'faq',
        }
      : undefined,
    directItems: blockConfig.directItems || blockConfig.items || [],
    title: blockConfig.title || '',
    subtitle: blockConfig.subtitle || '',
    showTitle: blockConfig.showTitle !== false,
    showSubtitle: blockConfig.showSubtitle !== false,
    titleAlign: blockConfig.titleAlign || 'left',
    showSearch: blockConfig.showSearch || false,
    searchPlaceholder: blockConfig.searchPlaceholder || '搜索问题...',
    iconType: blockConfig.iconType || 'chevron',
    animationDuration: blockConfig.animationDuration || 300,
    enableAnimation: blockConfig.enableAnimation !== false,
  };

  return {
    id: `faq-block-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: 'FAQBlock',
    props: {
      data: faqData,
    },
  };
}

