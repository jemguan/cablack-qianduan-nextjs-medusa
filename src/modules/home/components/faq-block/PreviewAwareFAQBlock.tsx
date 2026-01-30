"use client"

import { useMemo } from "react"
import { usePreviewConfig } from "@lib/context/preview-config-context"
import { FAQBlock } from "./FAQBlock"
import type { FAQBlockProps, FAQData } from "./types"

/**
 * 预览感知的 FAQBlock 包装组件
 * 预览模式下从 previewConfig 读取 FAQ 配置，实时更新
 */
export function PreviewAwareFAQBlock(props: FAQBlockProps) {
  const { previewConfig, isPreviewMode } = usePreviewConfig()

  const finalData = useMemo<FAQData>(() => {
    if (!isPreviewMode || !previewConfig) return props.data

    // 从 blockConfigs.faq 中获取第一个配置
    const faqConfigs = previewConfig.blockConfigs?.faq
    if (!faqConfigs) return props.data

    const entries = Object.values(faqConfigs)
    const blockConfig = entries.length > 0 ? (entries[0] as Record<string, any>) : null
    if (!blockConfig) return props.data

    // 用预览配置覆盖服务端 props
    return {
      ...props.data,
      items: blockConfig.items ?? props.data.items,
      directItems: blockConfig.directItems ?? props.data.directItems,
      dataMode: blockConfig.dataMode ?? props.data.dataMode,
      metafieldConfig: blockConfig.metafieldConfig ?? props.data.metafieldConfig,
      title: blockConfig.title ?? props.data.title,
      subtitle: blockConfig.subtitle ?? props.data.subtitle,
      showTitle: blockConfig.showTitle ?? props.data.showTitle,
      showSubtitle: blockConfig.showSubtitle ?? props.data.showSubtitle,
      titleAlign: blockConfig.titleAlign ?? props.data.titleAlign,
      theme: blockConfig.theme ?? props.data.theme,
      iconType: blockConfig.iconType ?? props.data.iconType,
      showSearch: blockConfig.showSearch ?? props.data.showSearch,
      searchPlaceholder: blockConfig.searchPlaceholder ?? props.data.searchPlaceholder,
      allowMultiple: blockConfig.allowMultiple ?? props.data.allowMultiple,
      defaultOpenFirst: blockConfig.defaultOpenFirst ?? props.data.defaultOpenFirst,
    }
  }, [isPreviewMode, previewConfig, props.data])

  return <FAQBlock data={finalData} />
}
