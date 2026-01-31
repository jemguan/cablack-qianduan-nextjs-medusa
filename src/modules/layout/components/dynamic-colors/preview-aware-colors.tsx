"use client"

import { useEffect } from "react"
import { usePreviewConfig } from "@lib/context/preview-config-context"
import { MedusaConfig } from "@lib/admin-api/config"

interface PreviewAwareColorsProps {
  serverConfig: MedusaConfig | null
}

function applyConfigToDOM(config: MedusaConfig | null) {
  if (typeof document === 'undefined' || !config) return

  const root = document.documentElement
  const header = config.headerConfig?.colors
  const footer = config.footerConfig?.colors
  const headerBg = config.headerConfig?.background
  const footerBg = config.footerConfig?.background
  const footerCopyrightBg = config.footerConfig?.copyrightBackground

  const isDark = root.classList.contains('dark')

  if (header) {
    const textColor = isDark ? header.darkTextColor : header.lightTextColor
    const linkHoverColor = isDark ? header.darkLinkHoverColor : header.lightLinkHoverColor
    const menuActiveColor = isDark ? header.darkMenuActiveColor : header.lightMenuActiveColor
    const menuIndicatorColor = isDark ? header.darkMenuIndicatorColor : header.lightMenuIndicatorColor
    const iconColor = isDark ? header.darkIconColor : header.lightIconColor
    const borderColor = isDark ? header.darkBorderColor : header.lightBorderColor

    if (textColor) root.style.setProperty('--header-text-color', textColor)
    if (linkHoverColor) root.style.setProperty('--header-link-hover-color', linkHoverColor)
    if (menuActiveColor) root.style.setProperty('--header-menu-active-color', menuActiveColor)
    if (menuIndicatorColor) root.style.setProperty('--header-menu-indicator-color', menuIndicatorColor)
    if (iconColor) root.style.setProperty('--header-icon-color', iconColor)
    if (borderColor) root.style.setProperty('--header-border-color', borderColor)
  }

  const inlineColors = config.headerConfig?.inlineColors
  if (inlineColors) {
    const triangleColor = isDark ? inlineColors.darkTriangleColor : inlineColors.lightTriangleColor
    const activeBgColor = isDark ? inlineColors.darkActiveBgColor : inlineColors.lightActiveBgColor
    if (triangleColor) root.style.setProperty('--header-inline-triangle-color', triangleColor)
    if (activeBgColor) root.style.setProperty('--header-inline-active-bg', activeBgColor)
  }

  if (headerBg) {
    const bgColor = isDark ? headerBg.darkBackgroundColor : headerBg.lightBackgroundColor
    if (bgColor) root.style.setProperty('--header-background-color', bgColor)
  }

  if (footer) {
    const textColor = isDark ? footer.darkTextColor : footer.lightTextColor
    const headingColor = isDark ? footer.darkHeadingColor : footer.lightHeadingColor
    const linkColor = isDark ? footer.darkLinkColor : footer.lightLinkColor
    const linkHoverColor = isDark ? footer.darkLinkHoverColor : footer.lightLinkHoverColor
    const copyrightTextColor = isDark ? footer.darkCopyrightTextColor : footer.lightCopyrightTextColor

    if (textColor) root.style.setProperty('--footer-text-color', textColor)
    if (headingColor) root.style.setProperty('--footer-heading-color', headingColor)
    if (linkColor) root.style.setProperty('--footer-link-color', linkColor)
    if (linkHoverColor) root.style.setProperty('--footer-link-hover-color', linkHoverColor)
    if (copyrightTextColor) root.style.setProperty('--footer-copyright-text-color', copyrightTextColor)
  }

  if (footerBg) {
    const bgColor = isDark ? footerBg.darkBackgroundColor : footerBg.lightBackgroundColor
    if (bgColor) root.style.setProperty('--footer-background-color', bgColor)
  }

  if (footerCopyrightBg) {
    const bgColor = isDark ? footerCopyrightBg.darkBackgroundColor : footerCopyrightBg.lightBackgroundColor
    if (bgColor) root.style.setProperty('--footer-copyright-background-color', bgColor)
  }

  console.log('[PreviewAwareColors] Applied CSS variables to DOM')
}

function generateServerCss(config: MedusaConfig | null): string {
  if (!config) return ''

  const header = config.headerConfig?.colors
  const inlineColors = config.headerConfig?.inlineColors
  const footer = config.footerConfig?.colors
  const headerBg = config.headerConfig?.background
  const footerBg = config.footerConfig?.background
  const footerCopyrightBg = config.footerConfig?.copyrightBackground

  if (!header && !inlineColors && !footer && !headerBg && !footerBg && !footerCopyrightBg) return ''

  return `
    :root {
      ${header?.lightTextColor ? `--header-text-color: ${header.lightTextColor};` : ''}
      ${header?.lightLinkHoverColor ? `--header-link-hover-color: ${header.lightLinkHoverColor};` : ''}
      ${header?.lightMenuActiveColor ? `--header-menu-active-color: ${header.lightMenuActiveColor};` : ''}
      ${header?.lightMenuIndicatorColor ? `--header-menu-indicator-color: ${header.lightMenuIndicatorColor};` : ''}
      ${header?.lightIconColor ? `--header-icon-color: ${header.lightIconColor};` : ''}
      ${header?.lightBorderColor ? `--header-border-color: ${header.lightBorderColor};` : ''}
      ${inlineColors?.lightTriangleColor ? `--header-inline-triangle-color: ${inlineColors.lightTriangleColor};` : ''}
      ${inlineColors?.lightActiveBgColor ? `--header-inline-active-bg: ${inlineColors.lightActiveBgColor};` : ''}
      ${headerBg?.lightBackgroundColor ? `--header-background-color: ${headerBg.lightBackgroundColor};` : ''}
      ${footer?.lightTextColor ? `--footer-text-color: ${footer.lightTextColor};` : ''}
      ${footer?.lightHeadingColor ? `--footer-heading-color: ${footer.lightHeadingColor};` : ''}
      ${footer?.lightLinkColor ? `--footer-link-color: ${footer.lightLinkColor};` : ''}
      ${footer?.lightLinkHoverColor ? `--footer-link-hover-color: ${footer.lightLinkHoverColor};` : ''}
      ${footer?.lightCopyrightTextColor ? `--footer-copyright-text-color: ${footer.lightCopyrightTextColor};` : ''}
      ${footerBg?.lightBackgroundColor ? `--footer-background-color: ${footerBg.lightBackgroundColor};` : ''}
      ${footerCopyrightBg?.lightBackgroundColor ? `--footer-copyright-background-color: ${footerCopyrightBg.lightBackgroundColor};` : ''}
    }
    .dark {
      ${header?.darkTextColor ? `--header-text-color: ${header.darkTextColor};` : ''}
      ${header?.darkLinkHoverColor ? `--header-link-hover-color: ${header.darkLinkHoverColor};` : ''}
      ${header?.darkMenuActiveColor ? `--header-menu-active-color: ${header.darkMenuActiveColor};` : ''}
      ${header?.darkMenuIndicatorColor ? `--header-menu-indicator-color: ${header.darkMenuIndicatorColor};` : ''}
      ${header?.darkIconColor ? `--header-icon-color: ${header.darkIconColor};` : ''}
      ${header?.darkBorderColor ? `--header-border-color: ${header.darkBorderColor};` : ''}
      ${inlineColors?.darkTriangleColor ? `--header-inline-triangle-color: ${inlineColors.darkTriangleColor};` : ''}
      ${inlineColors?.darkActiveBgColor ? `--header-inline-active-bg: ${inlineColors.darkActiveBgColor};` : ''}
      ${headerBg?.darkBackgroundColor ? `--header-background-color: ${headerBg.darkBackgroundColor};` : ''}
      ${footer?.darkTextColor ? `--footer-text-color: ${footer.darkTextColor};` : ''}
      ${footer?.darkHeadingColor ? `--footer-heading-color: ${footer.darkHeadingColor};` : ''}
      ${footer?.darkLinkColor ? `--footer-link-color: ${footer.darkLinkColor};` : ''}
      ${footer?.darkLinkHoverColor ? `--footer-link-hover-color: ${footer.darkLinkHoverColor};` : ''}
      ${footer?.darkCopyrightTextColor ? `--footer-copyright-text-color: ${footer.darkCopyrightTextColor};` : ''}
      ${footerBg?.darkBackgroundColor ? `--footer-background-color: ${footerBg.darkBackgroundColor};` : ''}
      ${footerCopyrightBg?.darkBackgroundColor ? `--footer-copyright-background-color: ${footerCopyrightBg.darkBackgroundColor};` : ''}
    }
  `
}

export default function PreviewAwareColors({ serverConfig }: PreviewAwareColorsProps) {
  const { previewConfig, isPreviewMode } = usePreviewConfig()

  useEffect(() => {
    if (isPreviewMode && previewConfig) {
      applyConfigToDOM(previewConfig)
    }
  }, [previewConfig, isPreviewMode])

  const serverCss = generateServerCss(serverConfig)
  if (!serverCss) return null

  return <style dangerouslySetInnerHTML={{ __html: serverCss }} />
}
