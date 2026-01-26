/**
 * Medusa 配置读取逻辑
 * 从管理前端 API 和 Medusa Store API 获取配置
 */

import { get } from './adminApi';
import { cache } from "react";
import { unstable_cache } from "next/cache";

// Medusa Backend URL
const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';

// Medusa Publishable API Key（Store API 需要）
const MEDUSA_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';

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
      mobileHeightPx?: number;
      desktopHeightPx?: number;
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
    background?: {
      lightBackgroundColor?: string;
      darkBackgroundColor?: string;
    };
    colors?: {
      lightTextColor?: string;
      darkTextColor?: string;
      lightLinkHoverColor?: string;
      darkLinkHoverColor?: string;
      lightMenuActiveColor?: string;
      darkMenuActiveColor?: string;
      lightMenuIndicatorColor?: string;
      darkMenuIndicatorColor?: string;
      lightIconColor?: string;
      darkIconColor?: string;
      lightBorderColor?: string;
      darkBorderColor?: string;
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
    background?: {
      lightBackgroundColor?: string;
      darkBackgroundColor?: string;
    };
    copyrightBackground?: {
      lightBackgroundColor?: string;
      darkBackgroundColor?: string;
    };
    colors?: {
      lightTextColor?: string;
      darkTextColor?: string;
      lightHeadingColor?: string;
      darkHeadingColor?: string;
      lightLinkColor?: string;
      darkLinkColor?: string;
      lightLinkHoverColor?: string;
      darkLinkHoverColor?: string;
      lightCopyrightTextColor?: string;
      darkCopyrightTextColor?: string;
    };
    announcement?: {
      enabled?: boolean;
      title?: string;
      subtitle?: string;
      text?: string;
      link?: string;
      linkText?: string;
      imageUrl?: string;
      lightLogoUrl?: string;
      darkLogoUrl?: string;
      imageSizePx?: number;
      paymentMethods?: Array<{
        name: string;
        iconUrl?: string;
        lightIconUrl?: string;
        darkIconUrl?: string;
      }>;
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
 * 内部实现：从 Medusa Store API 获取 Layout 配置（Header/Footer）
 */
interface LayoutConfigResponse {
  success: boolean;
  data?: {
    headerConfig: MedusaConfig['headerConfig'];
    footerConfig: MedusaConfig['footerConfig'];
  };
}

const _getLayoutConfigFromMedusa = async (): Promise<LayoutConfigResponse['data'] | null> => {
  const url = `${MEDUSA_BACKEND_URL}/store/layout-config`;
  console.log('[Layout Config] Fetching from:', url);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Store API 需要 Publishable API Key
    if (MEDUSA_PUBLISHABLE_KEY) {
      headers['x-publishable-api-key'] = MEDUSA_PUBLISHABLE_KEY;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      next: { revalidate: 300 }, // 5 分钟缓存
    });

    if (!response.ok) {
      console.warn('[Layout Config] Failed to fetch from Medusa:', response.status, response.statusText);
      return null;
    }

    const data: LayoutConfigResponse = await response.json();
    console.log('[Layout Config] Response:', JSON.stringify(data, null, 2));

    if (data.success && data.data) {
      return data.data;
    }
    console.warn('[Layout Config] No data in response or success=false');
    return null;
  } catch (error) {
    console.error('[Layout Config] Failed to fetch from Medusa:', error);
    return null;
  }
};

/**
 * 使用 unstable_cache 进行跨请求缓存（5分钟）
 */
const cachedLayoutConfig = unstable_cache(
  _getLayoutConfigFromMedusa,
  ["layout-config"],
  { revalidate: 300 }
);

/**
 * 内部实现：获取 Medusa 配置（旧的 Admin API，用于其他配置）
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
 * 优先从 Medusa Store API 获取 Header/Footer 配置
 * 其他配置继续从旧的 Admin API 获取
 */
export const getMedusaConfig = cache(async (): Promise<MedusaConfig | null> => {
  // 并行获取两个数据源
  const [layoutConfig, otherConfig] = await Promise.all([
    cachedLayoutConfig(),
    cachedMedusaConfig(),
  ]);

  console.log('[getMedusaConfig] layoutConfig:', layoutConfig ? 'has data' : 'null');
  console.log('[getMedusaConfig] otherConfig:', otherConfig ? 'has data' : 'null');

  // 如果两个都没有数据，返回 null
  if (!layoutConfig && !otherConfig) {
    console.warn('[getMedusaConfig] Both sources returned null');
    return null;
  }

  // 合并配置，Layout 配置优先
  const mergedConfig = {
    ...otherConfig,
    headerConfig: layoutConfig?.headerConfig || otherConfig?.headerConfig,
    footerConfig: layoutConfig?.footerConfig || otherConfig?.footerConfig,
  };

  console.log('[getMedusaConfig] headerConfig source:', layoutConfig?.headerConfig ? 'layoutConfig' : 'otherConfig');
  console.log('[getMedusaConfig] footerConfig source:', layoutConfig?.footerConfig ? 'layoutConfig' : 'otherConfig');

  return mergedConfig;
});

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

