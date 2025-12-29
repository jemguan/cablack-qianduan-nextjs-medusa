"use client"

import { useRef } from "react"
import { useParams } from "next/navigation"
import type { BundleSaleBlockProps, BundleSaleData } from "./types"
import { useBundleProducts } from "./hooks"
import { DEFAULT_BUNDLE_SALE_CONFIG } from "./config"
import { DesktopBundleSale } from "./DesktopBundleSale"
import { MobileBundleSale } from "./MobileBundleSale"
import { useResponsiveRender } from "@lib/hooks/useResponsiveRender"
import { useIntersection } from "@lib/hooks/use-in-view"
import { Text, clx } from "@medusajs/ui"

/**
 * Bundle Sale 主组件
 * 响应式切换桌面端和移动端布局
 * 样式与其他 block 保持统一
 */
export function BundleSale({ product, region, config }: BundleSaleBlockProps) {
  const params = useParams()
  const countryCode = params.countryCode as string
  
  // 视口检测 - 性能优化
  const ref = useRef<HTMLDivElement>(null)
  const isVisible = useIntersection(ref, "200px")

  const { isDesktop, isHydrated } = useResponsiveRender()

  const mergedConfig: BundleSaleData = {
    ...DEFAULT_BUNDLE_SALE_CONFIG,
    ...config,
  }

  const {
    showOnDesktop = true,
    showOnMobile = true,
    title = DEFAULT_BUNDLE_SALE_CONFIG.title,
    subtitle = DEFAULT_BUNDLE_SALE_CONFIG.subtitle,
    showTitle = DEFAULT_BUNDLE_SALE_CONFIG.showTitle,
    showSubtitle = DEFAULT_BUNDLE_SALE_CONFIG.showSubtitle,
    titleAlign = DEFAULT_BUNDLE_SALE_CONFIG.titleAlign,
  } = mergedConfig

  // 获取 bundle 及完整产品数据
  const { bundlesWithProducts, loading } = useBundleProducts(
    product.id,
    region.id,
    countryCode
  )

  // 检查是否应该显示
  if (!isHydrated) {
    return <div ref={ref} aria-hidden="true" />
  }
  
  if (isDesktop && !showOnDesktop) return null
  if (!isDesktop && !showOnMobile) return null

  // 没有可见或正在加载
  if (!isVisible || loading) {
    return (
      <div ref={ref} className="content-container my-16 small:my-32">
        {loading && (
          <div className="w-full animate-pulse">
            <div className="h-8 bg-ui-bg-subtle rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-ui-bg-subtle rounded-lg"></div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // 没有 bundle 数据
  if (bundlesWithProducts.length === 0) {
    return <div ref={ref} />
  }

  // 标题对齐样式
  const titleAlignClass = clx({
    "text-left": titleAlign === "left",
    "text-center": titleAlign === "center",
    "text-right": titleAlign === "right",
  })

  return (
    <div ref={ref} className="content-container my-16 small:my-32">
      {/* 标题区域 - 使用配置 */}
      {(showTitle || showSubtitle) && (
        <div className={clx("mb-8", titleAlignClass)}>
          {showTitle && title && (
            <Text className="txt-xlarge mb-2">{title}</Text>
          )}
          {showSubtitle && subtitle && (
            <Text className="txt-small text-muted-foreground">
              {subtitle}
            </Text>
          )}
        </div>
      )}

      {/* 产品展示区域 */}
      {isDesktop ? (
        <DesktopBundleSale
          currentProduct={product}
          region={region}
          bundlesWithProducts={bundlesWithProducts}
          config={mergedConfig}
        />
      ) : (
        <MobileBundleSale
          currentProduct={product}
          region={region}
          bundlesWithProducts={bundlesWithProducts}
          config={mergedConfig}
        />
      )}
    </div>
  )
}

export default BundleSale
