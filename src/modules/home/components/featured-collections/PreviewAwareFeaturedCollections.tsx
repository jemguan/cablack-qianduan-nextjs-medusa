"use client"

import { useMemo, useEffect, useState, useCallback } from "react"
import { usePreviewConfig } from "@lib/context/preview-config-context"
import { FeaturedCollectionsClient } from "./FeaturedCollectionsClient"
import type { HttpTypes } from "@medusajs/types"

interface PreviewAwareFeaturedCollectionsProps {
  category: HttpTypes.StoreProductCategory
  region: HttpTypes.StoreRegion
  products: HttpTypes.StoreProduct[]
  title?: string
  subtitle?: string
  showTitle?: boolean
  showSubtitle?: boolean
  titleAlign?: "left" | "center" | "right"
  maxCount?: number
  desktopCols?: number
  desktopMaxCount?: number
  desktopEnableCarousel?: boolean
  desktopCarouselConfig?: Record<string, any>
  mobileLayout?: "grid" | "carousel"
  mobileCols?: number
  mobileCarouselConfig?: Record<string, any>
  showViewAll?: boolean
  viewAllUrl?: string
  viewAllText?: string
}

function hasProductInStock(product: HttpTypes.StoreProduct): boolean {
  if (!product.variants || product.variants.length === 0) return false
  return product.variants.some((variant) => {
    if (variant.manage_inventory === false) return true
    if (variant.allow_backorder === true) return true
    return (variant.inventory_quantity || 0) > 0
  })
}

function getMedusaUrl(): string {
  if (typeof window !== "undefined") {
    return (
      (window as any).__MEDUSA_BACKEND_URL__ ||
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
      "http://localhost:9000"
    )
  }
  return "http://localhost:9000"
}

/**
 * 预览感知的 FeaturedCollections 包装组件
 * 预览模式下支持根据 collectionIds 变化在客户端获取产品数据
 */
export function PreviewAwareFeaturedCollections(
  props: PreviewAwareFeaturedCollectionsProps
) {
  const { previewConfig, isPreviewMode } = usePreviewConfig()
  const [previewProducts, setPreviewProducts] = useState<HttpTypes.StoreProduct[] | null>(null)
  const [previewCategory, setPreviewCategory] = useState<HttpTypes.StoreProductCategory | null>(null)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  const blockConfig = useMemo(() => {
    if (!isPreviewMode || !previewConfig) return null
    const fcConfigs = previewConfig.blockConfigs?.featuredCollections
    if (!fcConfigs) return null
    const entries = Object.values(fcConfigs)
    return entries.length > 0 ? (entries[0] as Record<string, any>) : null
  }, [isPreviewMode, previewConfig])

  const previewCategoryId = useMemo(() => {
    if (!blockConfig) return null
    const ids = blockConfig.collectionIds || []
    return ids[0] || null
  }, [blockConfig])

  const fetchPreviewProducts = useCallback(
    async (categoryId: string, regionId: string) => {
      setIsLoadingProducts(true)
      try {
        const baseUrl = getMedusaUrl()
        const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (publishableKey) headers["x-publishable-api-key"] = publishableKey

        // 获取分类信息
        const catRes = await fetch(
          `${baseUrl}/store/product-categories?id=${categoryId}&fields=id,name,handle`,
          { headers }
        )
        if (catRes.ok) {
          const catData = await catRes.json()
          const cats = catData.product_categories || []
          if (cats.length > 0) setPreviewCategory(cats[0])
        }

        // 获取产品数据
        const params = new URLSearchParams({
          category_id: categoryId,
          region_id: regionId,
          limit: "24",
          fields:
            "*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder",
        })

        const res = await fetch(`${baseUrl}/store/products?${params.toString()}`, { headers })
        if (res.ok) {
          const data = await res.json()
          setPreviewProducts((data.products || []).filter(hasProductInStock))
        } else {
          setPreviewProducts([])
        }
      } catch (err) {
        console.error("[PreviewAwareFeaturedCollections] Error fetching products:", err)
        setPreviewProducts([])
      } finally {
        setIsLoadingProducts(false)
      }
    },
    []
  )

  useEffect(() => {
    if (!isPreviewMode || !previewCategoryId) return

    if (previewCategoryId !== props.category?.id) {
      fetchPreviewProducts(previewCategoryId, props.region.id)
    } else {
      setPreviewProducts(null)
      setPreviewCategory(null)
    }
  }, [isPreviewMode, previewCategoryId, props.category?.id, props.region.id, fetchPreviewProducts])

  const overriddenProps = useMemo(() => {
    if (!isPreviewMode || !blockConfig) return props

    return {
      ...props,
      title: blockConfig.title ?? props.title,
      subtitle: blockConfig.subtitle ?? props.subtitle,
      showTitle: blockConfig.showTitle ?? props.showTitle,
      showSubtitle: blockConfig.showSubtitle ?? props.showSubtitle,
      titleAlign: blockConfig.titleAlign ?? props.titleAlign,
      maxCount: blockConfig.maxCount ?? props.maxCount,
      desktopCols: blockConfig.desktopCols ?? props.desktopCols,
      desktopMaxCount: blockConfig.desktopMaxCount ?? props.desktopMaxCount,
      desktopEnableCarousel: blockConfig.desktopEnableCarousel ?? props.desktopEnableCarousel,
      desktopCarouselConfig: blockConfig.desktopCarouselConfig ?? props.desktopCarouselConfig,
      mobileLayout: blockConfig.mobileLayout ?? props.mobileLayout,
      mobileCols: blockConfig.mobileCols ?? props.mobileCols,
      mobileCarouselConfig: blockConfig.mobileCarouselConfig ?? props.mobileCarouselConfig,
      showViewAll: blockConfig.showViewAll ?? props.showViewAll,
      viewAllUrl: blockConfig.viewAllUrl ?? props.viewAllUrl,
      viewAllText: blockConfig.viewAllText ?? props.viewAllText,
    }
  }, [isPreviewMode, blockConfig, props])

  const finalCategory = previewCategory || overriddenProps.category
  const finalProducts = previewProducts !== null ? previewProducts : overriddenProps.products

  const {
    title,
    subtitle,
    showTitle,
    showSubtitle,
    titleAlign,
    maxCount,
    desktopCols,
    desktopMaxCount,
    desktopEnableCarousel,
    desktopCarouselConfig,
    mobileLayout,
    mobileCols,
    mobileCarouselConfig,
    showViewAll,
    viewAllUrl,
    viewAllText,
    region,
  } = overriddenProps

  if (isLoadingProducts) {
    return (
      <div className="content-container py-12 small:py-24">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!finalCategory || !finalProducts || finalProducts.length === 0) {
    return null
  }

  const finalViewAllUrl = viewAllUrl || `/categories/${finalCategory.handle}`

  return (
    <div className="content-container py-12 small:py-24">
      <FeaturedCollectionsClient
        category={finalCategory}
        region={region}
        products={finalProducts}
        title={title}
        subtitle={subtitle}
        showTitle={showTitle}
        showSubtitle={showSubtitle}
        titleAlign={titleAlign}
        maxCount={maxCount}
        desktopCols={desktopCols}
        desktopMaxCount={desktopMaxCount}
        desktopEnableCarousel={desktopEnableCarousel}
        desktopCarouselConfig={desktopCarouselConfig}
        mobileLayout={mobileLayout}
        mobileCols={mobileCols}
        mobileCarouselConfig={mobileCarouselConfig}
        showViewAll={showViewAll}
        viewAllUrl={finalViewAllUrl}
        viewAllText={viewAllText}
      />
    </div>
  )
}
