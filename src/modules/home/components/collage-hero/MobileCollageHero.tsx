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

interface MobileCollageHeroProps {
  containerData: CollageHeroData
  className?: string
  region?: HttpTypes.StoreRegion
}

/**
 * 移动端 CollageHero 组件
 *
 * 优化：添加组件级别的 Intersection Observer，当组件离开视窗时清理资源
 */
export function MobileCollageHero({
  containerData,
  className = "",
  region,
}: MobileCollageHeroProps) {
  const {
    mobileBackgroundImage,
    desktopBackgroundImage,
    mobileBackgroundVideo,
    desktopBackgroundVideo,
    backgroundImageAlt,
    backgroundVideoAutoplay = true,
    backgroundVideoLoop = true,
    backgroundVideoMuted = true,
    backgroundVideoPoster,
    modules,
    backgroundZIndex = DEFAULT_COLLAGE_HERO_CONFIG.backgroundZIndex || 0,
    mobileBlockHeight = "220vh",
    mobileOverlayStartVh = 100,
    mobileOverlayEndVh = 180,
    mobileBackgroundImageOpacity = 1,
    desktopBackgroundImageOpacity = 1,
  } = containerData

  // 移动端优先使用移动端资源，如果没有则使用桌面端资源
  const backgroundVideo = mobileBackgroundVideo || desktopBackgroundVideo
  const backgroundImage = mobileBackgroundImage || desktopBackgroundImage
  // 移动端优先使用移动端透明度，如果没有则使用桌面端透明度
  const backgroundImageOpacity =
    mobileBackgroundImageOpacity !== undefined
      ? mobileBackgroundImageOpacity
      : desktopBackgroundImageOpacity

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
    backgroundVideo,
    backgroundImage,
  })

  // 滚动透明度
  const scrollState = useScrollOpacity({
    contentRef,
    isComponentVisible,
    headerHeight,
    overlayStartVh: mobileOverlayStartVh,
    overlayEndVh: mobileOverlayEndVh,
  })

  return (
    <div className={`relative ${className}`}>
      <BackgroundLayer
        headerHeight={headerHeight}
        backgroundZIndex={backgroundZIndex}
        backgroundVideo={backgroundVideo}
        backgroundImage={backgroundImage}
        backgroundVideoPoster={backgroundVideoPoster}
        backgroundVideoAutoplay={backgroundVideoAutoplay}
        backgroundVideoLoop={backgroundVideoLoop}
        backgroundVideoMuted={backgroundVideoMuted}
        backgroundImageAlt={backgroundImageAlt}
        backgroundImageOpacity={backgroundImageOpacity}
        backgroundOpacity={scrollState.backgroundOpacity}
        overlayOpacity={scrollState.overlayOpacity}
        isComponentVisible={isComponentVisible}
        backgroundVideoRef={backgroundVideoRef}
      />

      <div ref={contentRef} className="relative z-0">
        <div
          className="relative w-full mx-auto py-16"
          style={{ minHeight: mobileBlockHeight }}
        >
          <AnimatePresence>
            {modules.map((module, index) => (
              <ModuleRenderer
                key={module.id}
                module={module}
                index={index}
                overlayOpacity={scrollState.overlayOpacity}
                products={containerData.products}
                isMobile={true}
                isComponentVisible={isComponentVisible}
                blockHeight={mobileBlockHeight}
                region={region}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
