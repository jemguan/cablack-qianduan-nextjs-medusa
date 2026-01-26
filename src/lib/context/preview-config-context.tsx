"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { MedusaConfig } from "@lib/admin-api/config"

/**
 * Admin 端发送的 LayoutConfigFormData 类型（简化版，只包含需要的字段）
 */
interface AdminLayoutConfigFormData {
  header_light_logo_url?: string | null
  header_dark_logo_url?: string | null
  header_logo_alt?: string | null
  header_logo_mobile_height_px?: number | null
  header_logo_desktop_height_px?: number | null
  header_brand_name_part1?: string | null
  header_brand_name_part1_color_class?: string | null
  header_brand_name_part2?: string | null
  header_brand_name_part2_color_class?: string | null
  header_brand_name_size_class?: string | null
  header_brand_name_weight_class?: string | null
  header_brand_name_tracking_class?: string | null
  header_brand_name_gap_class?: string | null
  header_show_brand_name?: boolean
  header_menu_items?: Array<{
    id: string
    label: string
    url: string
    openInNewTab?: boolean
    children?: Array<{
      id: string
      label: string
      url: string
      openInNewTab?: boolean
      children?: Array<{
        id: string
        label: string
        url: string
        openInNewTab?: boolean
      }>
    }>
  }>
  header_light_background_color?: string | null
  header_dark_background_color?: string | null
  header_light_text_color?: string | null
  header_light_link_hover_color?: string | null
  header_light_menu_active_color?: string | null
  header_light_menu_indicator_color?: string | null
  header_light_icon_color?: string | null
  header_light_border_color?: string | null
  header_dark_text_color?: string | null
  header_dark_link_hover_color?: string | null
  header_dark_menu_active_color?: string | null
  header_dark_menu_indicator_color?: string | null
  header_dark_icon_color?: string | null
  header_dark_border_color?: string | null
  footer_light_logo_url?: string | null
  footer_dark_logo_url?: string | null
  footer_logo_alt?: string | null
  footer_brand_name_part1?: string | null
  footer_brand_name_part1_color_class?: string | null
  footer_brand_name_part2?: string | null
  footer_brand_name_part2_color_class?: string | null
  footer_menu_items?: Array<{
    id: string
    label: string
    url: string
    openInNewTab?: boolean
    children?: Array<{
      id: string
      label: string
      url: string
      openInNewTab?: boolean
      children?: Array<{
        id: string
        label: string
        url: string
        openInNewTab?: boolean
      }>
    }>
  }>
  footer_light_background_color?: string | null
  footer_dark_background_color?: string | null
  footer_copyright_light_background_color?: string | null
  footer_copyright_dark_background_color?: string | null
  footer_light_text_color?: string | null
  footer_light_heading_color?: string | null
  footer_light_link_color?: string | null
  footer_light_link_hover_color?: string | null
  footer_light_copyright_text_color?: string | null
  footer_dark_text_color?: string | null
  footer_dark_heading_color?: string | null
  footer_dark_link_color?: string | null
  footer_dark_link_hover_color?: string | null
  footer_dark_copyright_text_color?: string | null
  footer_announcement_enabled?: boolean
  footer_announcement_title?: string | null
  footer_announcement_subtitle?: string | null
  footer_announcement_text?: string | null
  footer_announcement_link?: string | null
  footer_announcement_link_text?: string | null
  footer_announcement_image_url?: string | null
  footer_announcement_light_logo_url?: string | null
  footer_announcement_dark_logo_url?: string | null
  footer_announcement_image_size_px?: number | null
  footer_announcement_payment_methods?: Array<{
    name: string
    iconUrl?: string
    lightIconUrl?: string
    darkIconUrl?: string
  }>
  footer_newsletter_enabled?: boolean
  footer_newsletter_title?: string | null
  footer_newsletter_description?: string | null
  footer_newsletter_placeholder?: string | null
  footer_social_share_enabled?: boolean
  footer_social_share_platforms?: string[]
  footer_copyright_enabled?: boolean
  footer_copyright_text?: string | null
  footer_powered_by_enabled?: boolean
  footer_powered_by_text?: string | null
  footer_powered_by_links?: Array<{
    text: string
    url: string
    openInNewTab?: boolean
  }>
}

interface PreviewConfigContextValue {
  previewConfig: MedusaConfig | null
  isPreviewMode: boolean
}

const PreviewConfigContext = createContext<PreviewConfigContextValue>({
  previewConfig: null,
  isPreviewMode: false,
})

/**
 * 将 Admin 端的 LayoutConfigFormData 转换为前端的 MedusaConfig 格式
 */
function transformAdminConfigToMedusaConfig(adminConfig: AdminLayoutConfigFormData): MedusaConfig {
  return {
    headerConfig: {
      logo: {
        lightLogoUrl: adminConfig.header_light_logo_url || undefined,
        darkLogoUrl: adminConfig.header_dark_logo_url || undefined,
        logoAlt: adminConfig.header_logo_alt || undefined,
        mobileHeightPx: adminConfig.header_logo_mobile_height_px || undefined,
        desktopHeightPx: adminConfig.header_logo_desktop_height_px || undefined,
      },
      brand: {
        brandNamePart1: adminConfig.header_brand_name_part1 || undefined,
        brandNamePart1ColorClass: adminConfig.header_brand_name_part1_color_class || undefined,
        brandNamePart2: adminConfig.header_brand_name_part2 || undefined,
        brandNamePart2ColorClass: adminConfig.header_brand_name_part2_color_class || undefined,
        brandNameSizeClass: adminConfig.header_brand_name_size_class || undefined,
        brandNameWeightClass: adminConfig.header_brand_name_weight_class || undefined,
        brandNameTrackingClass: adminConfig.header_brand_name_tracking_class || undefined,
        brandNameGapClass: adminConfig.header_brand_name_gap_class || undefined,
        showBrandName: adminConfig.header_show_brand_name,
      },
      menu: {
        menuItems: adminConfig.header_menu_items,
      },
      background: {
        lightBackgroundColor: adminConfig.header_light_background_color || undefined,
        darkBackgroundColor: adminConfig.header_dark_background_color || undefined,
      },
      colors: {
        lightTextColor: adminConfig.header_light_text_color || undefined,
        darkTextColor: adminConfig.header_dark_text_color || undefined,
        lightLinkHoverColor: adminConfig.header_light_link_hover_color || undefined,
        darkLinkHoverColor: adminConfig.header_dark_link_hover_color || undefined,
        lightMenuActiveColor: adminConfig.header_light_menu_active_color || undefined,
        darkMenuActiveColor: adminConfig.header_dark_menu_active_color || undefined,
        lightMenuIndicatorColor: adminConfig.header_light_menu_indicator_color || undefined,
        darkMenuIndicatorColor: adminConfig.header_dark_menu_indicator_color || undefined,
        lightIconColor: adminConfig.header_light_icon_color || undefined,
        darkIconColor: adminConfig.header_dark_icon_color || undefined,
        lightBorderColor: adminConfig.header_light_border_color || undefined,
        darkBorderColor: adminConfig.header_dark_border_color || undefined,
      },
    },
    footerConfig: {
      logo: {
        lightLogoUrl: adminConfig.footer_light_logo_url || undefined,
        darkLogoUrl: adminConfig.footer_dark_logo_url || undefined,
        logoAlt: adminConfig.footer_logo_alt || undefined,
      },
      brand: {
        brandNamePart1: adminConfig.footer_brand_name_part1 || undefined,
        brandNamePart1ColorClass: adminConfig.footer_brand_name_part1_color_class || undefined,
        brandNamePart2: adminConfig.footer_brand_name_part2 || undefined,
        brandNamePart2ColorClass: adminConfig.footer_brand_name_part2_color_class || undefined,
      },
      menu: {
        menuItems: adminConfig.footer_menu_items,
      },
      background: {
        lightBackgroundColor: adminConfig.footer_light_background_color || undefined,
        darkBackgroundColor: adminConfig.footer_dark_background_color || undefined,
      },
      copyrightBackground: {
        lightBackgroundColor: adminConfig.footer_copyright_light_background_color || undefined,
        darkBackgroundColor: adminConfig.footer_copyright_dark_background_color || undefined,
      },
      colors: {
        lightTextColor: adminConfig.footer_light_text_color || undefined,
        darkTextColor: adminConfig.footer_dark_text_color || undefined,
        lightHeadingColor: adminConfig.footer_light_heading_color || undefined,
        darkHeadingColor: adminConfig.footer_dark_heading_color || undefined,
        lightLinkColor: adminConfig.footer_light_link_color || undefined,
        darkLinkColor: adminConfig.footer_dark_link_color || undefined,
        lightLinkHoverColor: adminConfig.footer_light_link_hover_color || undefined,
        darkLinkHoverColor: adminConfig.footer_dark_link_hover_color || undefined,
        lightCopyrightTextColor: adminConfig.footer_light_copyright_text_color || undefined,
        darkCopyrightTextColor: adminConfig.footer_dark_copyright_text_color || undefined,
      },
      announcement: {
        enabled: adminConfig.footer_announcement_enabled,
        title: adminConfig.footer_announcement_title || undefined,
        subtitle: adminConfig.footer_announcement_subtitle || undefined,
        text: adminConfig.footer_announcement_text || undefined,
        link: adminConfig.footer_announcement_link || undefined,
        linkText: adminConfig.footer_announcement_link_text || undefined,
        imageUrl: adminConfig.footer_announcement_image_url || undefined,
        lightLogoUrl: adminConfig.footer_announcement_light_logo_url || undefined,
        darkLogoUrl: adminConfig.footer_announcement_dark_logo_url || undefined,
        imageSizePx: adminConfig.footer_announcement_image_size_px || undefined,
        paymentMethods: adminConfig.footer_announcement_payment_methods,
      },
      newsletter: {
        enabled: adminConfig.footer_newsletter_enabled,
        title: adminConfig.footer_newsletter_title || undefined,
        description: adminConfig.footer_newsletter_description || undefined,
        placeholder: adminConfig.footer_newsletter_placeholder || undefined,
      },
      socialShare: {
        enabled: adminConfig.footer_social_share_enabled,
        platforms: adminConfig.footer_social_share_platforms,
      },
      copyright: {
        enabled: adminConfig.footer_copyright_enabled,
        text: adminConfig.footer_copyright_text || undefined,
      },
      poweredBy: {
        enabled: adminConfig.footer_powered_by_enabled,
        text: adminConfig.footer_powered_by_text || undefined,
        links: adminConfig.footer_powered_by_links,
      },
    },
  }
}

interface PreviewConfigProviderProps {
  children: React.ReactNode
}

export function PreviewConfigProvider({ children }: PreviewConfigProviderProps) {
  const [previewConfig, setPreviewConfig] = useState<MedusaConfig | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  const handleMessage = useCallback((event: MessageEvent) => {
    console.log('[PreviewConfig] Received message from:', event.origin, 'type:', event.data?.type)
    
    if (event.data?.type !== 'MEDUSA_ADMIN_PREVIEW_CONFIG') {
      return
    }

    console.log('[PreviewConfig] Processing config update:', event.data.config)

    const adminConfig = event.data.config as AdminLayoutConfigFormData
    const transformedConfig = transformAdminConfigToMedusaConfig(adminConfig)
    
    console.log('[PreviewConfig] Transformed config:', transformedConfig)
    
    setPreviewConfig(transformedConfig)
    setIsPreviewMode(true)
  }, [])

  useEffect(() => {
    // 只在 iframe 中运行时监听消息
    if (typeof window === 'undefined') return
    
    // 检查是否在 iframe 中
    const isInIframe = window !== window.parent
    if (!isInIframe) return

    console.log('[PreviewConfig] Running in iframe, listening for admin messages')
    
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  return (
    <PreviewConfigContext.Provider value={{ previewConfig, isPreviewMode }}>
      {children}
    </PreviewConfigContext.Provider>
  )
}

export function usePreviewConfig() {
  return useContext(PreviewConfigContext)
}
