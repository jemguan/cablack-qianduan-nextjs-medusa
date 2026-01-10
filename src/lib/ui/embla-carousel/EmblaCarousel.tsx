"use client"

import { useMemo } from "react"
import { useResponsiveRender } from "@lib/hooks/useResponsiveRender"
import { DesktopEmblaCarousel } from "./DesktopEmblaCarousel"
import { MobileEmblaCarousel } from "./MobileEmblaCarousel"
import type { EmblaCarouselProps } from "./types"

/**
 * EmblaCarousel 组件
 * 基于 Embla Carousel 的响应式轮播组件
 */
export function EmblaCarousel({
  children,
  desktopSlidesPerView,
  mobileSlidesPerView,
  className = "",
  ...props
}: EmblaCarouselProps) {
  // 将 children 转换为数组
  const childrenArray = useMemo(() => {
    return Array.isArray(children) ? children : [children]
  }, [children])

  const { isDesktop, isHydrated } = useResponsiveRender()

  // hydration 之前返回占位符，确保服务端和客户端渲染一致
  if (!isHydrated) {
    const finalClassName = className ? `embla ${className}`.trim() : "embla"
    return (
      <div className={finalClassName}>
        <div className="flex items-center justify-center min-h-[300px] bg-muted rounded-lg">
          <span className="text-muted-foreground text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  // 根据屏幕尺寸只渲染对应的组件
  return isDesktop ? (
    <DesktopEmblaCarousel
      {...props}
      className={className}
      desktopSlidesPerView={desktopSlidesPerView}
    >
      {childrenArray}
    </DesktopEmblaCarousel>
  ) : (
    <MobileEmblaCarousel
      {...props}
      className={className}
      mobileSlidesPerView={mobileSlidesPerView}
    >
      {childrenArray}
    </MobileEmblaCarousel>
  )
}

