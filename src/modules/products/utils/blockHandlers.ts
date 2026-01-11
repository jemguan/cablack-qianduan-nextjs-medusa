/**
 * Product Page Block Handlers
 * 处理产品页不同类型的 block 配置
 */

import type { HttpTypes } from '@medusajs/types';
import type { BlockConfig } from './getProductPageLayoutBlocks';
import type { FAQData } from '../../home/components/faq-block/types';
import { parseFAQMetadata } from '../../home/components/faq-block/utils';
import type { RecentlyViewedProductsData } from '../components/recently-viewed-products/types';
import type { BundleSaleData } from '../components/bundle-sale/types';
import type { ReviewsData } from '../components/reviews/types';
import type { BannerBlockData } from '../../home/components/banner-block/types';
import type { LoyaltyAccount } from '@/types/loyalty';

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
  initialVariantId?: string,
  htmlDescription?: string | null,
  customer?: HttpTypes.StoreCustomer | null,
  loyaltyAccount?: LoyaltyAccount | null,
  membershipProductIds?: Record<string, boolean> | null
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
      htmlDescription,
      customer,
      loyaltyAccount,
      membershipProductIds,
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

/**
 * 处理 BundleSale Block
 * 用于在产品页面展示捆绑销售
 */
export function handleBundleSaleBlock(
  block: {
    id: string;
    type: string;
    enabled: boolean;
    order: number;
    config: Record<string, any>;
  },
  blockConfig: Record<string, any>,
  product: HttpTypes.StoreProduct,
  region: HttpTypes.StoreRegion
): BlockConfig | null {
  // 如果禁用，返回 null
  if (blockConfig.enabled === false) {
    return null;
  }

  // 构建 BundleSaleData
  const data: BundleSaleData = {
    enabled: blockConfig.enabled !== false,
    title: blockConfig.title || 'Bundle Deals',
    subtitle: blockConfig.subtitle || 'Save more when you buy together',
    showTitle: blockConfig.showTitle !== false,
    showSubtitle: blockConfig.showSubtitle !== false,
    titleAlign: blockConfig.titleAlign || 'left',
    maxItems: blockConfig.maxItems || 4,
    showProducts: blockConfig.showProducts !== false,
    maxProducts: blockConfig.maxProducts || 4,
    showOnDesktop: blockConfig.showOnDesktop !== false,
    showOnMobile: blockConfig.showOnMobile !== false,
    ctaText: blockConfig.ctaText || 'Buy Together & Save',
    showDiscountBadge: blockConfig.showDiscountBadge !== false,
    desktopBundleCols: blockConfig.desktopBundleCols || 1,
    desktopMaxCount: blockConfig.desktopMaxCount || 3,
    desktopEnableCarousel: blockConfig.desktopEnableCarousel || false,
    desktopCarouselLoop: blockConfig.desktopCarouselLoop || false,
    desktopCarouselAutoplay: blockConfig.desktopCarouselAutoplay || false,
    desktopCarouselAutoplayDelay: blockConfig.desktopCarouselAutoplayDelay || 3000,
    desktopCarouselSpacing: blockConfig.desktopCarouselSpacing || 24,
    desktopCarouselShowNavigation: blockConfig.desktopCarouselShowNavigation !== false,
    desktopCarouselShowPagination: blockConfig.desktopCarouselShowPagination !== false,
    desktopCarouselAlign: blockConfig.desktopCarouselAlign || 'start',
    desktopCarouselDraggable: blockConfig.desktopCarouselDraggable !== false,
    mobileLayout: blockConfig.mobileLayout || 'grid',
    mobileCols: blockConfig.mobileCols || 1,
    mobileCarouselSlidesPerView: blockConfig.mobileCarouselSlidesPerView || 1,
    mobileCarouselLoop: blockConfig.mobileCarouselLoop || false,
    mobileCarouselAutoplay: blockConfig.mobileCarouselAutoplay || false,
    mobileCarouselAutoplayDelay: blockConfig.mobileCarouselAutoplayDelay || 3000,
    mobileCarouselSpacing: blockConfig.mobileCarouselSpacing || 16,
    mobileCarouselShowNavigation: blockConfig.mobileCarouselShowNavigation || false,
    mobileCarouselShowPagination: blockConfig.mobileCarouselShowPagination !== false,
    mobileCarouselAlign: blockConfig.mobileCarouselAlign || 'start',
    mobileCarouselDraggable: blockConfig.mobileCarouselDraggable !== false,
  };

  return {
    id: `bundle-sale-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: 'BundleSaleBlock',
    props: {
      product,
      region,
      config: data,
    },
  };
}

/**
 * 处理 Reviews Block
 * 用于在产品页面展示客户评论
 */
export function handleReviewsBlock(
  block: {
    id: string;
    type: string;
    enabled: boolean;
    order: number;
    config: Record<string, any>;
  },
  blockConfig: Record<string, any>,
  product: HttpTypes.StoreProduct,
  region: HttpTypes.StoreRegion
): BlockConfig | null {
  // 如果禁用，返回 null
  if (blockConfig.enabled === false) {
    return null;
  }

  // 构建 ReviewsData
  const data: ReviewsData = {
    enabled: blockConfig.enabled !== false,
    title: blockConfig.title || 'Customer Reviews',
    subtitle: blockConfig.subtitle || 'Share your experience with this product',
    showTitle: blockConfig.showTitle !== false,
    showSubtitle: blockConfig.showSubtitle !== false,
    titleAlign: blockConfig.titleAlign || 'left',
    showStats: blockConfig.showStats !== false,
    showForm: blockConfig.showForm !== false,
    showOnDesktop: blockConfig.showOnDesktop !== false,
    showOnMobile: blockConfig.showOnMobile !== false,
    limit: blockConfig.limit || 10,
    defaultSort: blockConfig.defaultSort || 'newest',
    allowAnonymous: blockConfig.allowAnonymous !== false,
    requireVerifiedPurchase: blockConfig.requireVerifiedPurchase || false,
  };

  return {
    id: `reviews-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: 'ReviewsBlock',
    props: {
      product,
      region,
      config: data,
    },
  };
}

/**
 * 处理 BannerBlock Block
 * 用于在产品页面展示 banner 图片
 */
export function handleBannerBlock(
  block: {
    id: string;
    type: string;
    enabled: boolean;
    order: number;
    config: Record<string, any>;
  },
  blockConfig: Record<string, any>
): BlockConfig | null {
  // 如果禁用，返回 null
  if (blockConfig.enabled === false) {
    return null;
  }

  // 构建 BannerBlockData
  const bannerBlockData: BannerBlockData = {
    modules: (blockConfig.modules || []).map((module: any) => {
      // 处理图片 URL，兼容旧的 object 格式
      let imageUrl = '';
      if (typeof module.image === 'string') {
        imageUrl = module.image;
      } else if (module.image?.desktop) {
        imageUrl = module.image.desktop;
      }

      return {
        id: module.id || `module-${Date.now()}-${Math.random()}`,
        image: imageUrl,
        link: module.link,
        linkTarget: module.linkTarget || '_self',
        showOnDesktop: module.showOnDesktop !== false,
        showOnMobile: module.showOnMobile !== false,
        desktopCols: module.desktopCols !== undefined && module.desktopCols !== null
          ? (typeof module.desktopCols === 'number' ? module.desktopCols : parseInt(String(module.desktopCols), 10) || 1)
          : 1,
        rowSpan: module.rowSpan !== undefined && module.rowSpan !== null
          ? (typeof module.rowSpan === 'number' ? module.rowSpan : parseInt(String(module.rowSpan), 10) || 1)
          : 1,
      };
    }),
    gridCols: blockConfig.gridCols !== undefined && blockConfig.gridCols !== null 
      ? (typeof blockConfig.gridCols === 'number' ? blockConfig.gridCols : parseInt(String(blockConfig.gridCols), 10) || 1)
      : 1,
    gridGap: blockConfig.gridGap !== undefined && blockConfig.gridGap !== null
      ? (typeof blockConfig.gridGap === 'number' ? blockConfig.gridGap : parseInt(String(blockConfig.gridGap), 10) || 24)
      : 24,
    mobileGridCols: blockConfig.mobileGridCols !== undefined && blockConfig.mobileGridCols !== null
      ? (typeof blockConfig.mobileGridCols === 'number' ? blockConfig.mobileGridCols : parseInt(String(blockConfig.mobileGridCols), 10) || 1)
      : 1,
    fullWidth: blockConfig.fullWidth === true,
  };

  return {
    id: `banner-block-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: 'BannerBlock',
    props: {
      data: bannerBlockData,
    },
  };
}

