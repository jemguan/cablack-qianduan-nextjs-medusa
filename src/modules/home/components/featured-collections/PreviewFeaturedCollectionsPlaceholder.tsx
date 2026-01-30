"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { usePreviewConfig } from "@lib/context/preview-config-context"
import { FeaturedCollectionsClient } from "./FeaturedCollectionsClient"
import type { HttpTypes } from "@medusajs/types"

interface PreviewFeaturedCollectionsPlaceholderProps {
  region: HttpTypes.StoreRegion
  /** 服务端已渲染的 featured-collections block IDs，避免重复渲染 */
  renderedBlockIds?: string[]
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
 * 预览模式下的 FeaturedCollections 占位组件
 * 当服务端没有渲染 FeaturedCollections 时（尚未保存 section），
 * 这个组件在预览模式下根据 previewConfig 动态获取并渲染产品
 */
export function PreviewFeaturedCollectionsPlaceholder({
  region,
  renderedBlockIds = [],
}: PreviewFeaturedCollectionsPlaceholderProps) {
  const { previewConfig, isPreviewMode } = usePreviewConfig()
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [category, setCategory] = useState<HttpTypes.StoreProductCategory | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 从 previewConfig 中获取未被服务端渲染的 featuredCollections blockConfig
  const blockConfig = useMemo(() => {
    if (!isPreviewMode || !previewConfig) return null
    const fcConfigs = previewConfig.blockConfigs?.featuredCollections
    if (!fcConfigs) return null

    // 查找第一个未被服务端渲染的配置
    for (const [blockId, config] of Object.entries(fcConfigs)) {
      if (!renderedBlockIds.includes(blockId)) {
        return config as Record<string, any>
      }
    }
    return null
  }, [isPreviewMode, previewConfig, renderedBlockIds])

  const categoryId = useMemo(() => {
    if (!blockConfig) return null
    const ids = blockConfig.collectionIds || []
    return ids[0] || null
  }, [blockConfig])

  const fetchProducts = useCallback(
    async (catId: string, regionId: string) => {
      setIsLoading(true)
      try {
        const baseUrl = getMedusaUrl()
        const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (publishableKey) headers["x-publishable-api-key"] = publishableKey

        // 获取分类
        const catRes = await fetch(
          `${baseUrl}/store/product-categories?id=${catId}&fields=id,name,handle`,
          { headers }
        )
        if (catRes.ok) {
          const catData = await catRes.json()
          const cats = catData.product_categories || []
          if (cats.length > 0) setCategory(cats[0])
        }

        // 获取产品
        const params = new URLSearchParams({
          category_id: catId,
          region_id: regionId,
          limit: "24",
          fields:
            "*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder",
        })

        const res = await fetch(`${baseUrl}/store/products?${params.toString()}`, { headers })
        if (res.ok) {
          const data = await res.json()
          setProducts((data.products || []).filter(hasProductInStock))
        } else {
          setProducts([])
        }
      } catch (err) {
        console.error("[PreviewFeaturedCollectionsPlaceholder] Error:", err)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (!categoryId) {
      setProducts([])
      setCategory(null)
      return
    }
    fetchProducts(categoryId, region.id)
  }, [categoryId, region.id, fetchProducts])

  // 非预览模式或没有配置时不渲染
  if (!isPreviewMode || !blockConfig) return null

  if (isLoading) {
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

  if (!category || products.length === 0) return null

  const viewAllUrl = blockConfig.viewAllUrl || `/categories/${category.handle}`

  return (
    <div className="content-container py-12 small:py-24">
      <FeaturedCollectionsClient
        category={category}
        region={region}
        products={products}
        title={blockConfig.title}
        subtitle={blockConfig.subtitle}
        showTitle={blockConfig.showTitle}
        showSubtitle={blockConfig.showSubtitle}
        titleAlign={blockConfig.titleAlign}
        maxCount={blockConfig.maxCount}
        desktopCols={blockConfig.desktopCols}
        desktopMaxCount={blockConfig.desktopMaxCount}
        desktopEnableCarousel={blockConfig.desktopEnableCarousel}
        desktopCarouselConfig={blockConfig.desktopCarouselConfig}
        mobileLayout={blockConfig.mobileLayout}
        mobileCols={blockConfig.mobileCols}
        mobileCarouselConfig={blockConfig.mobileCarouselConfig}
        showViewAll={blockConfig.showViewAll}
        viewAllUrl={viewAllUrl}
        viewAllText={blockConfig.viewAllText}
      />
    </div>
  )
}
