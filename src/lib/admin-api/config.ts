/**
 * Medusa 配置读取逻辑
 * 从管理前端 API 获取配置
 */

import { get } from './adminApi';

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
  pageLayouts?: Record<string, string[]>;
  pageConfigs?: Record<string, any>;
  blockConfigs?: Record<string, any>;
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
 * 获取 Medusa 配置
 */
export async function getMedusaConfig(): Promise<MedusaConfig | null> {
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

