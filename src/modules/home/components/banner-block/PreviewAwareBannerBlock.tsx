"use client"

import { useMemo } from "react"
import { usePreviewConfig } from "@lib/context/preview-config-context"
import { BannerBlock } from "./BannerBlock"
import type { BannerBlockProps, BannerBlockData } from "./types"

function processImageUrl(image: any): string {
  if (typeof image === "string") return image
  if (image?.desktop) return image.desktop
  return ""
}

function safeParseInt(value: any, defaultValue: number): number {
  const parsed = parseInt(String(value), 10)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * 预览感知的 BannerBlock 包装组件
 * 在 iframe 预览模式下从 previewConfig 读取最新配置
 * 非预览模式下直接使用服务端传入的 props
 */
export function PreviewAwareBannerBlock(props: BannerBlockProps & { blockId?: string }) {
  const { previewConfig, isPreviewMode } = usePreviewConfig()

  const previewData = useMemo<BannerBlockData | null>(() => {
    if (!isPreviewMode || !previewConfig) return null

    const bannerConfigs = previewConfig.blockConfigs?.bannerBlock
    if (!bannerConfigs) return null

    // 通过 blockId 查找对应配置，回退到第一个
    const blockConfig = (props.blockId && bannerConfigs[props.blockId]
      ? bannerConfigs[props.blockId]
      : Object.values(bannerConfigs)[0]) as Record<string, any>
    if (!blockConfig) return null

    return {
      modules: (blockConfig.modules || []).map((module: any) => ({
        id: module.id || "",
        image: processImageUrl(module.image),
        link: module.link,
        linkTarget: module.linkTarget || "_self",
        showOnDesktop: module.showOnDesktop !== false,
        showOnMobile: module.showOnMobile !== false,
        desktopCols: safeParseInt(module.desktopCols, 1),
        rowSpan: safeParseInt(module.rowSpan, 1),
      })),
      gridCols: safeParseInt(blockConfig.gridCols, 1),
      gridGap: safeParseInt(blockConfig.gridGap, 24),
      mobileGridCols: safeParseInt(blockConfig.mobileGridCols, 1),
      fullWidth: blockConfig.fullWidth === true,
    }
  }, [isPreviewMode, previewConfig, props.blockId])

  const data = previewData || props.data

  return <BannerBlock data={data} />
}
