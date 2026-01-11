/**
 * Medusa 配置读取逻辑
 * 从管理前端 API 获取配置
 */

import { get } from './adminApi';
import { cache } from "react";
import { unstable_cache } from "next/cache";

export interface MedusaConfig {
  brand?: {
    name?: string;
    tagline?: string;
    description?: string;
    domain?: string;
    url?: string;
    email?: string;
  };
  social?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  logo?: {
    lightUrl?: string;
    darkUrl?: string;
    alt?: string;
    mobileHeight?: string;
    desktopHeight?: string;
  };
  brandText?: {
    showBrandName?: boolean;
    brandNamePart1?: string;
    brandNamePart1Color?: string;
    brandNamePart2?: string;
    brandNamePart2Color?: string;
    brandNameSize?: string;
    brandNameWeight?: string;
    brandNameTracking?: string;
    brandNameGap?: string;
  };
  favicon?: {
    icon?: string;
    svg?: string;
    appleTouch?: string;
    icon32?: string;
    icon16?: string;
  };
  seo?: {
    titleSuffix?: string;
    defaultDescription?: string;
    ogImage?: string;
    ogImageWidth?: string;
    ogImageHeight?: string;
    twitterCard?: string;
    language?: string;
    locale?: string;
  };
  pwa?: {
    name?: string;
    shortName?: string;
    themeColor?: string;
    backgroundColor?: string;
  };
  themeConfig?: {
    primaryColor?: string;
    secondaryColor?: string;
    radius?: number;
  };
  pageLayouts?: {
    [pageType: string]: {
      blocks: Array<{
        id: string;
        type: string;
        enabled: boolean;
        order: number;
      }>;
    };
  };
  pageConfigs?: Record<string, any>;
  blockConfigs?: {
    [blockType: string]: {
      [blockId: string]: Record<string, any>;
    };
  };
  headerConfig?: {
    logo?: {
      lightLogoUrl?: string;
      darkLogoUrl?: string;
      logoAlt?: string;
      mobileHeightClass?: string;
      desktopHeightClass?: string;
    };
    brand?: {
      brandNamePart1?: string;
      brandNamePart1ColorClass?: string;
      brandNamePart2?: string;
      brandNamePart2ColorClass?: string;
      brandNameSize?: string;
      brandNameSizeClass?: string;
      brandNameWeight?: string;
      brandNameWeightClass?: string;
      brandNameTracking?: string;
      brandNameTrackingClass?: string;
      brandNameGap?: string;
      brandNameGapClass?: string;
      showBrandName?: boolean;
    };
    menu?: {
      menuItems?: Array<{
        id: string;
        label: string;
        url: string;
        openInNewTab?: boolean;
        children?: Array<{
          id: string;
          label: string;
          url: string;
          openInNewTab?: boolean;
        }>;
      }>;
    };
  };
  footerConfig?: {
    logo?: {
      lightLogoUrl?: string;
      darkLogoUrl?: string;
      logoAlt?: string;
    };
    brand?: {
      brandNamePart1?: string;
      brandNamePart1ColorClass?: string;
      brandNamePart2?: string;
      brandNamePart2ColorClass?: string;
    };
    menu?: {
      menuItems?: Array<{
        id: string;
        label: string;
        url: string;
        openInNewTab?: boolean;
        children?: Array<{
          id: string;
          label: string;
          url: string;
          openInNewTab?: boolean;
        }>;
      }>;
    };
    announcement?: {
      enabled?: boolean;
      text?: string;
      link?: string;
      linkText?: string;
      imageUrl?: string;
      lightLogoUrl?: string;
      darkLogoUrl?: string;
    };
    newsletter?: {
      enabled?: boolean;
      title?: string;
      description?: string;
      placeholder?: string;
    };
    socialShare?: {
      enabled?: boolean;
      platforms?: string[];
    };
    copyright?: {
      enabled?: boolean;
      text?: string; // 例如: "© {year} Onahole Station. All rights reserved."
    };
    poweredBy?: {
      enabled?: boolean;
      text?: string; // 例如: "Powered by Medusa & Next.js"
      links?: Array<{
        text: string;
        url: string;
        openInNewTab?: boolean;
      }>;
    };
  };
  productPageConfig?: {
    layout?: 'two-column' | 'three-column';
    enabled?: boolean;
  };
  shippingReturnsConfig?: {
    enabled?: boolean;
    items?: Array<{
      id: string;
      icon?: 'fastDelivery' | 'refresh' | 'back' | 'custom';
      customIcon?: string; // URL or SVG for custom icon
      title: string;
      description: string;
    }>;
  };
  reviewsEnabled?: boolean; // 是否启用评论功能
  checkoutPageConfig?: {
    storeBrand: {
      type: 'logo' | 'text';
      logo?: {
        lightLogoUrl: string;
        darkLogoUrl: string;
        logoAlt: string;
        mobileHeightClass?: string;
        desktopHeightClass?: string;
      };
      text?: {
        storeName: string;
        textSize?: string;
        textColor?: string;
      };
    };
    poweredBy: {
      enabled: boolean;
      text: string;
    };
  };
}

export interface MedusaCategory {
  id: number;
  userId: number;
  name: string;
  handle: string;
  url?: string;
  parentId?: number;
  sortOrder: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  children?: MedusaCategory[];
}

/**
 * 内部实现：获取 Medusa 配置
 */
const _getMedusaConfigInternal = async (): Promise<MedusaConfig | null> => {
  try {
    const response = await get<MedusaConfig>('/api/public/medusa/config');
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('[Medusa Config] Failed to fetch config:', error);
    return null;
  }
}

/**
 * 使用 unstable_cache 进行跨请求缓存（5分钟）
 */
const cachedMedusaConfig = unstable_cache(
  _getMedusaConfigInternal,
  ["medusa-config"],
  { revalidate: 300 }
);

/**
 * 获取 Medusa 配置
 * 使用 cache() 在单次渲染周期内去重
 * 使用 unstable_cache 在跨请求间缓存（5分钟）
 */
export const getMedusaConfig = cache(cachedMedusaConfig);

/**
 * 获取 Medusa 目录树
 */
export async function getMedusaCategories(): Promise<MedusaCategory[]> {
  try {
    const response = await get<MedusaCategory[]>('/api/public/medusa/categories');
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('[Medusa Categories] Failed to fetch categories:', error);
    return [];
  }
}

