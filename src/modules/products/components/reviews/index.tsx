"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { useIntersection } from "@lib/hooks/use-in-view"
import { clx } from "@medusajs/ui"
import type { ReviewsProps, Review } from "./types"
import DesktopReviews from "./DesktopReviews"
import MobileReviews from "./MobileReviews"
import { DEFAULT_REVIEWS_CONFIG } from "./config"
import { getReviews } from "@lib/data/reviews"

/**
 * Reviews 主组件
 * 使用 CSS 媒体查询切换桌面端和移动端布局
 * 数据获取在父组件进行，避免重复 API 请求
 */
export function Reviews({ product, region, config }: ReviewsProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isVisible = useIntersection(ref, "200px")
  const hasLoadedRef = useRef(false)

  // 评论数据状态 - 在父组件管理，避免子组件重复请求
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsCount, setReviewsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

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
    limit = DEFAULT_REVIEWS_CONFIG.limit,
  } = mergedConfig

  // 加载评论数据 - 只在父组件中进行一次
  const loadReviews = useCallback(async (force = false) => {
    if (hasLoadedRef.current && !force) {
      return
    }

    setIsLoading(true)
    try {
      const result = await getReviews({
        product_id: product.id,
        status: "approved",
        limit,
        offset: 0,
        order_by: "created_at",
        order: "DESC",
      })
      setReviews(result.reviews || [])
      setReviewsCount(result.count || 0)
      hasLoadedRef.current = true
    } catch (error) {
      console.error("Failed to load reviews:", error)
      setReviews([])
      setReviewsCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [product.id, limit])

  // 当组件可见时加载数据
  useEffect(() => {
    if (isVisible && !hasLoadedRef.current) {
      loadReviews()
    }
  }, [isVisible, loadReviews])

  // 如果禁用，不渲染
  if (!enabled) {
    return null
  }

  // 没有可见时不渲染内容（懒加载）
  if (!isVisible) {
    return (
      <div ref={ref} className="content-container my-16 small:my-32 min-h-[200px]">
        {/* Placeholder for lazy loading */}
      </div>
    )
  }

  // 标题对齐样式
  const titleAlignClass = clx({
    "text-left": titleAlign === "left",
    "text-center": titleAlign === "center",
    "text-right": titleAlign === "right",
  })

  // 刷新回调 - 传递给子组件
  const handleRefresh = () => loadReviews(true)

  return (
    <div ref={ref} className="content-container my-16 small:my-32">
      {/* 标题区域 - 使用配置 */}
      {(showTitle || showSubtitle) && (
        <div className={clx("mb-8", titleAlignClass)}>
          {showTitle && title && (
            <p className="txt-xlarge mb-2 font-normal font-sans">{title}</p>
          )}
          {showSubtitle && subtitle && (
            <p className="txt-small text-muted-foreground font-normal font-sans">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* 评论展示区域 - 使用 CSS 控制显示/隐藏 */}
      {/* 桌面端版本 */}
      {showOnDesktop && (
        <div className="hidden small:block">
          <DesktopReviews
            product={product}
            region={region}
            config={mergedConfig}
            reviews={reviews}
            reviewsCount={reviewsCount}
            isLoading={isLoading}
            onRefresh={handleRefresh}
          />
        </div>
      )}
      {/* 移动端版本 */}
      {showOnMobile && (
        <div className="block small:hidden">
          <MobileReviews
            product={product}
            region={region}
            config={mergedConfig}
            reviews={reviews}
            reviewsCount={reviewsCount}
            isLoading={isLoading}
            onRefresh={handleRefresh}
          />
        </div>
      )}
    </div>
  )
}

export default Reviews

