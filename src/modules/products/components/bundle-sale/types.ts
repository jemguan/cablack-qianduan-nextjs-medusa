/**
 * Bundle Sale Block 组件类型定义
 */

import type { Bundle, BundleProduct } from "@lib/types/bundle"
import type { HttpTypes } from "@medusajs/types"

/**
 * Bundle Sale Block 数据接口
 */
export interface BundleSaleData {
  /** 是否启用 */
  enabled?: boolean
  /** 标题 */
  title?: string
  /** 副标题 */
  subtitle?: string
  /** 是否显示标题 */
  showTitle?: boolean
  /** 是否显示副标题 */
  showSubtitle?: boolean
  /** 标题对齐方式 */
  titleAlign?: "left" | "center" | "right"
  /** 最大显示数量 */
  maxItems?: number
  /** 是否显示产品列表 */
  showProducts?: boolean
  /** 产品显示数量 */
  maxProducts?: number
  /** 桌面端可见性 */
  showOnDesktop?: boolean
  /** 移动端可见性 */
  showOnMobile?: boolean
  /** CTA 按钮文本 */
  ctaText?: string
  /** 是否显示折扣标签 */
  showDiscountBadge?: boolean
  /** 桌面端配置 */
  desktopBundleCols?: number
  desktopMaxCount?: number
  desktopEnableCarousel?: boolean
  desktopCarouselLoop?: boolean
  desktopCarouselAutoplay?: boolean
  desktopCarouselAutoplayDelay?: number
  desktopCarouselSpacing?: number
  desktopCarouselShowNavigation?: boolean
  desktopCarouselShowPagination?: boolean
  desktopCarouselAlign?: "start" | "center" | "end"
  desktopCarouselDraggable?: boolean
  /** 移动端配置 */
  mobileLayout?: "carousel" | "grid"
  mobileCols?: number
  mobileCarouselSlidesPerView?: number
  mobileCarouselLoop?: boolean
  mobileCarouselAutoplay?: boolean
  mobileCarouselAutoplayDelay?: number
  mobileCarouselSpacing?: number
  mobileCarouselShowNavigation?: boolean
  mobileCarouselShowPagination?: boolean
  mobileCarouselAlign?: "start" | "center" | "end"
  mobileCarouselDraggable?: boolean
}

/**
 * Bundle Sale Block Props 接口
 */
export interface BundleSaleBlockProps {
  /** 当前产品 */
  product: HttpTypes.StoreProduct
  /** 区域信息 */
  region: HttpTypes.StoreRegion
  /** Bundle Sale 配置 */
  config?: BundleSaleData
}

/**
 * Bundle Sale 内部 Props 接口
 */
export interface BundleSaleProps {
  /** 当前产品信息 */
  currentProduct: {
    id: string
    handle: string
    title: string
    thumbnail?: string | null
    variants?: HttpTypes.StoreProductVariant[]
  }
  /** 区域信息 */
  region: HttpTypes.StoreRegion
  /** Bundle 列表 */
  bundles: Bundle[]
  /** 配置 */
  config: BundleSaleData
}

/**
 * Bundle 卡片 Props 接口
 */
export interface BundleCardProps {
  bundle: Bundle
  currentProduct: {
    id: string
    handle: string
    title: string
    thumbnail?: string | null
    variants?: HttpTypes.StoreProductVariant[]
  }
  region: HttpTypes.StoreRegion
  config: BundleSaleData
}

/**
 * 产品卡片 Props 接口
 */
export interface BundleProductCardProps {
  product: {
    id: string
    title: string
    handle?: string
    thumbnail?: string | null
    variants?: HttpTypes.StoreProductVariant[]
    quantity?: number
  }
  region: HttpTypes.StoreRegion
  isMainProduct?: boolean
  selectedVariantId?: string
  onVariantChange?: (productId: string, variantId: string) => void
}

