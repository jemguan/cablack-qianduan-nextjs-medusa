"use client"

import { useMemo } from "react"
import { usePreviewConfig } from "@lib/context/preview-config-context"
import { CountdownBannerBlock } from "./CountdownBannerBlock"
import type { CountdownBannerData, ContentPosition } from "../../utils/handlers/countdownBanner"

interface Props {
  data: CountdownBannerData
  blockId?: string
}

export function PreviewAwareCountdownBannerBlock({ data, blockId }: Props) {
  const { previewConfig, isPreviewMode } = usePreviewConfig()

  const previewData = useMemo<CountdownBannerData | null>(() => {
    if (!isPreviewMode || !previewConfig) return null

    const configs = previewConfig.blockConfigs?.countdownBanner
    if (!configs) return null

    const blockConfig = (blockId && configs[blockId]
      ? configs[blockId]
      : Object.values(configs)[0]) as Record<string, any>
    if (!blockConfig) return null

    return {
      endTime: blockConfig.endTime || "",
      showTitle: blockConfig.showTitle !== false,
      title: blockConfig.title || "",
      showSubtitle: blockConfig.showSubtitle === true,
      subtitle: blockConfig.subtitle || "",
      buttonText: blockConfig.buttonText || "PRE-ORDER NOW!",
      buttonLink: blockConfig.buttonLink || "",
      buttonLinkTarget: blockConfig.buttonLinkTarget || "_self",
      backgroundColor: blockConfig.backgroundColor || "#FFF9E6",
      backgroundImage: blockConfig.backgroundImage || "",
      backgroundImageMobile: blockConfig.backgroundImageMobile || "",
      textColor: blockConfig.textColor || "#000000",
      buttonBgColor: blockConfig.buttonBgColor || "#C2185B",
      buttonTextColor: blockConfig.buttonTextColor || "#FFFFFF",
      fullWidth: blockConfig.fullWidth === true,
      contentPosition: (blockConfig.contentPosition as ContentPosition) || "center",
      paddingY: typeof blockConfig.paddingY === "number" ? blockConfig.paddingY : 16,
    }
  }, [isPreviewMode, previewConfig, blockId])

  return <CountdownBannerBlock data={previewData || data} />
}
