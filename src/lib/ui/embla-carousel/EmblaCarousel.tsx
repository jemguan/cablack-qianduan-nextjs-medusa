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
  ...props
}: EmblaCarouselProps) {
  // 将 children 转换为数组
  const childrenArray = useMemo(() => {
    return Array.isArray(children) ? children : [children]
  }, [children])

  const { isDesktop, isHydrated } = useResponsiveRender()

  // hydration 之前返回 null，避免 SSR 渲染两个组件
  if (!isHydrated) {
    return null
  }

  // 根据屏幕尺寸只渲染对应的组件
  return isDesktop ? (
    <DesktopEmblaCarousel
      {...props}
      desktopSlidesPerView={desktopSlidesPerView}
    >
      {childrenArray}
    </DesktopEmblaCarousel>
  ) : (
    <MobileEmblaCarousel
      {...props}
      mobileSlidesPerView={mobileSlidesPerView}
    >
      {childrenArray}
    </MobileEmblaCarousel>
  )
}

