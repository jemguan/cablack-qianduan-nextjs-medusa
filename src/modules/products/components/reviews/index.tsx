"use client"

import { useRef } from "react"
import { useResponsiveRender } from "@lib/hooks/useResponsiveRender"
import { useIntersection } from "@lib/hooks/use-in-view"
import { Text, clx } from "@medusajs/ui"
import type { ReviewsProps } from "./types"
import DesktopReviews from "./DesktopReviews"
import MobileReviews from "./MobileReviews"
import { DEFAULT_REVIEWS_CONFIG } from "./config"

/**
 * Reviews 主组件
 * 响应式切换桌面端和移动端布局
 * 样式与其他 block 保持统一，宽度与 bundle sale 一致
 */
export function Reviews({ product, region, config }: ReviewsProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isVisible = useIntersection(ref, "200px")
  const { isDesktop, isHydrated } = useResponsiveRender()

  const mergedConfig = {
    ...DEFAULT_REVIEWS_CONFIG,
    ...config,
  }

  const {
    enabled = DEFAULT_REVIEWS_CONFIG.enabled,
    showOnDesktop = DEFAULT_REVIEWS_CONFIG.showOnDesktop,
    showOnMobile = DEFAULT_REVIEWS_CONFIG.showOnMobile,
    title = DEFAULT_REVIEWS_CONFIG.title,
    subtitle = DEFAULT_REVIEWS_CONFIG.subtitle,
    showTitle = DEFAULT_REVIEWS_CONFIG.showTitle,
    showSubtitle = DEFAULT_REVIEWS_CONFIG.showSubtitle,
    titleAlign = DEFAULT_REVIEWS_CONFIG.titleAlign,
  } = mergedConfig

  // 如果禁用，不渲染
  if (!enabled) {
    return null
  }

  // 检查是否应该显示
  if (!isHydrated) {
    return <div ref={ref} aria-hidden="true" />
  }

  if (isDesktop && !showOnDesktop) return null
  if (!isDesktop && !showOnMobile) return null

  // 没有可见时不渲染内容
  if (!isVisible) {
    return (
      <div ref={ref} className="content-container my-16 small:my-32">
        {/* Placeholder for loading state if needed */}
      </div>
    )
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

      {/* 评论展示区域 */}
      {isDesktop ? (
        <DesktopReviews product={product} region={region} config={mergedConfig} />
      ) : (
        <MobileReviews product={product} region={region} config={mergedConfig} />
      )}
    </div>
  )
}

export default Reviews

