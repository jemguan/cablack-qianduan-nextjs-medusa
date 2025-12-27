/**
 * Product Page Block Handlers
 * 处理产品页不同类型的 block 配置
 */

import type { HttpTypes } from '@medusajs/types';
import type { BlockConfig } from './getProductPageLayoutBlocks';
import type { FAQData } from '../../home/components/faq-block/types';
import { parseFAQMetadata } from '../../home/components/faq-block/utils';
import type { RecentlyViewedProductsData } from '../components/recently-viewed-products/types';

/**
 * 处理 ProductContent Block
 * 这是产品页的核心内容区域，包含产品图片、信息、操作等
 */
export function handleProductContentBlock(
  block: {
    id: string;
    type: string;
    enabled: boolean;
    order: number;
    config: Record<string, any>;
  },
  blockConfig: Record<string, any>,
  product: HttpTypes.StoreProduct,
  region: HttpTypes.StoreRegion,
  images: HttpTypes.StoreProductImage[],
  initialVariantId?: string
): BlockConfig | null {
  // 确定布局类型，默认为 two-column
  const layout = blockConfig.layout || 'two-column';
  const isEnabled = blockConfig.enabled !== false;

  // 如果禁用，返回 null
  if (!isEnabled) {
    return null;
  }

  return {
    id: `product-content-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: 'ProductContent',
    props: {
      product,
      region,
      images,
      initialVariantId,
      layout,
      shippingReturnsConfig: blockConfig.shippingReturnsConfig,
    },
  };
}

/**
 * 处理 FAQ Block（产品页）
 * 支持从产品 metadata 读取数据
 */
export function handleFAQBlock(
  block: {
    id: string;
    type: string;
    enabled: boolean;
    order: number;
    config: Record<string, any>;
  },
  blockConfig: Record<string, any>,
  product?: HttpTypes.StoreProduct
): BlockConfig | null {
  // 构建 FAQData
  let faqItems: any[] = [];
  const dataMode = blockConfig.dataMode || 'direct';

  // 如果是 metadata 模式，从产品 metadata 读取
  if (dataMode === 'metadata' && product?.metadata) {
    const metafieldKey = blockConfig.metafieldConfig?.key || 'faq';
    const metadataValue = product.metadata[metafieldKey] as string | undefined;
    
    if (metadataValue) {
      // 如果 metadataValue 已经是对象，先转换为字符串
      const stringValue = typeof metadataValue === 'string' 
        ? metadataValue 
        : JSON.stringify(metadataValue);
      
      faqItems = parseFAQMetadata(stringValue);
      
      // 调试日志
      if (faqItems.length === 0) {
        console.warn(`[FAQ Block] Failed to parse FAQ metadata for key "${metafieldKey}". Value:`, metadataValue);
      } else {
        console.log(`[FAQ Block] Successfully parsed ${faqItems.length} FAQ items from metadata key "${metafieldKey}"`);
      }
    } else {
      console.warn(`[FAQ Block] Metadata key "${metafieldKey}" not found in product metadata. Available keys:`, Object.keys(product.metadata || {}));
    }
  } else {
    // 直接配置模式
    faqItems = blockConfig.directItems || blockConfig.items || [];
  }

  // 如果没有数据，返回 null（不渲染空的 FAQ block）
  if (faqItems.length === 0) {
    return null;
  }

  const faqData: FAQData = {
    items: faqItems,
    defaultOpenFirst: blockConfig.defaultOpenFirst || false,
    allowMultiple: blockConfig.allowMultiple || false,
    theme: blockConfig.theme || 'default',
    dataMode,
    metafieldConfig: blockConfig.metafieldConfig
      ? {
          key: blockConfig.metafieldConfig.key || 'faq',
        }
      : undefined,
    directItems: faqItems,
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

/**
 * 处理 RecentlyViewedProducts Block
 * 用于在产品页面展示最近浏览的产品
 */
export function handleRecentlyViewedProductsBlock(
  block: {
    id: string;
    type: string;
    enabled: boolean;
    order: number;
    config: Record<string, any>;
  },
  blockConfig: Record<string, any>,
  product: HttpTypes.StoreProduct,
  region: HttpTypes.StoreRegion,
  countryCode?: string
): BlockConfig | null {
  // 如果禁用，返回 null
  if (blockConfig.enabled === false) {
    return null;
  }

  // 构建 RecentlyViewedProductsData
  const data: RecentlyViewedProductsData = {
    enabled: blockConfig.enabled !== false,
    limit: blockConfig.limit || 8,
    currentProductId: product.id,
    layout: blockConfig.layout || 'grid',
    desktopCols: blockConfig.desktopCols || 3,
    desktopMaxCount: blockConfig.desktopMaxCount || 6,
    desktopEnableCarousel: blockConfig.desktopEnableCarousel || false,
    desktopCarouselLoop: blockConfig.desktopCarouselLoop || false,
    desktopCarouselAutoplay: blockConfig.desktopCarouselAutoplay || false,
    desktopCarouselAutoplayDelay: blockConfig.desktopCarouselAutoplayDelay || 3000,
    desktopCarouselSpacing: blockConfig.desktopCarouselSpacing || 24,
    desktopCarouselShowNavigation: blockConfig.desktopCarouselShowNavigation !== false,
    desktopCarouselShowPagination: blockConfig.desktopCarouselShowPagination !== false,
    desktopCarouselAlign: blockConfig.desktopCarouselAlign || 'start',
    desktopCarouselDraggable: blockConfig.desktopCarouselDraggable !== false,
    mobileLayout: blockConfig.mobileLayout || 'carousel',
    mobileCols: blockConfig.mobileCols || 2,
    mobileCarouselSlidesPerView: blockConfig.mobileCarouselSlidesPerView || 1.5,
    mobileCarouselLoop: blockConfig.mobileCarouselLoop || false,
    mobileCarouselAutoplay: blockConfig.mobileCarouselAutoplay || false,
    mobileCarouselAutoplayDelay: blockConfig.mobileCarouselAutoplayDelay || 3000,
    mobileCarouselSpacing: blockConfig.mobileCarouselSpacing || 16,
    mobileCarouselShowNavigation: blockConfig.mobileCarouselShowNavigation || false,
    mobileCarouselShowPagination: blockConfig.mobileCarouselShowPagination !== false,
    mobileCarouselAlign: blockConfig.mobileCarouselAlign || 'start',
    mobileCarouselDraggable: blockConfig.mobileCarouselDraggable !== false,
    title: blockConfig.title || 'Recently Viewed',
    subtitle: blockConfig.subtitle || 'Products you viewed recently',
    showTitle: blockConfig.showTitle !== false,
    showSubtitle: blockConfig.showSubtitle !== false,
    titleAlign: blockConfig.titleAlign || 'left',
  };

  return {
    id: `recently-viewed-products-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: 'RecentlyViewedProductsBlock',
    props: {
      data,
      region,
      countryCode,
    },
  };
}

