"use client"

import { useMemo } from "react"
import { usePreviewConfig } from "@lib/context/preview-config-context"
import { SlideshowBlock } from "./SlideshowBlock"
import type { SlideshowBlockProps, SlideshowBlockData } from "./types"

function processImageUrl(image: any): string {
  if (typeof image === "string") return image
  if (image?.desktop) return image.desktop
  return ""
}

export function PreviewAwareSlideshowBlock(
  props: SlideshowBlockProps & { blockId?: string }
) {
  const { previewConfig, isPreviewMode } = usePreviewConfig()

  const previewData = useMemo<SlideshowBlockData | null>(() => {
    if (!isPreviewMode || !previewConfig) return null

    const slideshowConfigs = previewConfig.blockConfigs?.slideshow
    if (!slideshowConfigs) return null

    const blockConfig = (props.blockId && slideshowConfigs[props.blockId]
      ? slideshowConfigs[props.blockId]
      : Object.values(slideshowConfigs)[0]) as Record<string, any>
    if (!blockConfig) return null

    return {
      slides: (blockConfig.slides || []).map((slide: any) => ({
        id: slide.id || "",
        mediaType: slide.mediaType || "image",
        image: processImageUrl(slide.image),
        videoUrl: slide.videoUrl || "",
        link: slide.link,
        linkTarget: slide.linkTarget || "_self",
        title: slide.title || "",
        subtitle: slide.subtitle || "",
        buttonText: slide.buttonText || "",
        buttonUrl: slide.buttonUrl || "",
        buttonTarget: slide.buttonTarget || "_self",
      })),
      autoplay: blockConfig.autoplay !== false,
      autoplayDelay: parseInt(String(blockConfig.autoplayDelay)) || 5000,
      loop: blockConfig.loop !== false,
      showNavigation: blockConfig.showNavigation !== false,
      showPagination: blockConfig.showPagination !== false,
      effect: blockConfig.effect || "slide",
      speed: parseInt(String(blockConfig.speed)) || 500,
      fullWidth: blockConfig.fullWidth === true,
      overlayOpacity:
        typeof blockConfig.overlayOpacity === "number"
          ? blockConfig.overlayOpacity
          : 0.3,
    }
  }, [isPreviewMode, previewConfig, props.blockId])

  const data = previewData || props.data

  return <SlideshowBlock data={data} />
}
