"use client"

import React, { useRef } from "react"
import { useHeaderHeight } from "@lib/hooks/useHeaderHeight"
import type { CollageHeroData } from "./types"
import { DEFAULT_COLLAGE_HERO_CONFIG } from "./config"
import type { HttpTypes } from "@medusajs/types"

import {
  AnimatePresence,
  ModuleRenderer,
  BackgroundLayer,
} from "./components"
import {
  useScrollOpacity,
  useComponentVisibility,
  useLinkPrefetch,
} from "./hooks"

interface DesktopCollageHeroProps {
  containerData: CollageHeroData
  className?: string
  region?: HttpTypes.StoreRegion
}

/**
 * 桌面端 CollageHero 组件
 *
 * 优化：添加组件级别的 Intersection Observer，当组件离开视窗时清理资源
 */
export function DesktopCollageHero({
  containerData,
  className = "",
  region,
}: DesktopCollageHeroProps) {
  const {
    desktopBackgroundImage,
    desktopBackgroundVideo,
    backgroundImageAlt,
    backgroundVideoAutoplay = true,
    backgroundVideoLoop = true,
    backgroundVideoMuted = true,
    backgroundVideoPoster,
    modules,
    backgroundZIndex = DEFAULT_COLLAGE_HERO_CONFIG.backgroundZIndex || 0,
    desktopBlockHeight = "220vh",
    desktopOverlayStartVh = 100,
    desktopOverlayEndVh = 180,
    desktopBackgroundImageOpacity = 1,
  } = containerData

  const contentRef = useRef<HTMLDivElement>(null)
  const backgroundVideoRef = useRef<HTMLVideoElement>(null)
  const headerHeight = useHeaderHeight()

  // 预取链接
  useLinkPrefetch({
    modules,
    products: containerData.products,
  })

  // 组件可见性管理
  const { isComponentVisible } = useComponentVisibility({
    contentRef,
    backgroundVideoRef,
    backgroundVideo: desktopBackgroundVideo,
    backgroundImage: desktopBackgroundImage,
  })

  // 滚动透明度
  const scrollState = useScrollOpacity({
    contentRef,
    isComponentVisible,
    headerHeight,
    overlayStartVh: desktopOverlayStartVh,
    overlayEndVh: desktopOverlayEndVh,
  })

  return (
    <div className={`relative ${className}`}>
      <BackgroundLayer
        headerHeight={headerHeight}
        backgroundZIndex={backgroundZIndex}
        backgroundVideo={desktopBackgroundVideo}
        backgroundImage={desktopBackgroundImage}
        backgroundVideoPoster={backgroundVideoPoster}
        backgroundVideoAutoplay={backgroundVideoAutoplay}
        backgroundVideoLoop={backgroundVideoLoop}
        backgroundVideoMuted={backgroundVideoMuted}
        backgroundImageAlt={backgroundImageAlt}
        backgroundImageOpacity={desktopBackgroundImageOpacity}
        backgroundOpacity={scrollState.backgroundOpacity}
        overlayOpacity={scrollState.overlayOpacity}
        isComponentVisible={isComponentVisible}
        backgroundVideoRef={backgroundVideoRef}
      />

      <div ref={contentRef} className="relative z-0">
        <div
          className="relative w-full mx-auto py-24"
          style={{ minHeight: desktopBlockHeight }}
        >
          <AnimatePresence>
            {modules.map((module, index) => (
              <ModuleRenderer
                key={module.id}
                module={module}
                index={index}
                overlayOpacity={scrollState.overlayOpacity}
                products={containerData.products}
                isMobile={false}
                isComponentVisible={isComponentVisible}
                blockHeight={desktopBlockHeight}
                region={region}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
