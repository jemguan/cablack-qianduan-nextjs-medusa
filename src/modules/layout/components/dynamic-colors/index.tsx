import { MedusaConfig } from "@lib/admin-api/config"

export default function DynamicColors({ config }: { config: MedusaConfig | null }) {
  if (!config) return null

  const header = config.headerConfig?.colors
  const inlineColors = config.headerConfig?.inlineColors
  const footer = config.footerConfig?.colors

  if (!header && !inlineColors && !footer) return null

  const css = `
    :root {
      ${header?.lightTextColor ? `--header-text-color: ${header.lightTextColor};` : ''}
      ${header?.lightLinkHoverColor ? `--header-link-hover-color: ${header.lightLinkHoverColor};` : ''}
      ${header?.lightMenuActiveColor ? `--header-menu-active-color: ${header.lightMenuActiveColor};` : ''}
      ${header?.lightMenuIndicatorColor ? `--header-menu-indicator-color: ${header.lightMenuIndicatorColor};` : ''}
      ${header?.lightIconColor ? `--header-icon-color: ${header.lightIconColor};` : ''}
      ${header?.lightBorderColor ? `--header-border-color: ${header.lightBorderColor};` : ''}
      ${inlineColors?.lightTriangleColor ? `--header-inline-triangle-color: ${inlineColors.lightTriangleColor};` : ''}
      ${inlineColors?.lightActiveBgColor ? `--header-inline-active-bg: ${inlineColors.lightActiveBgColor};` : ''}

      ${footer?.lightTextColor ? `--footer-text-color: ${footer.lightTextColor};` : ''}
      ${footer?.lightHeadingColor ? `--footer-heading-color: ${footer.lightHeadingColor};` : ''}
      ${footer?.lightLinkColor ? `--footer-link-color: ${footer.lightLinkColor};` : ''}
      ${footer?.lightLinkHoverColor ? `--footer-link-hover-color: ${footer.lightLinkHoverColor};` : ''}
      ${footer?.lightCopyrightTextColor ? `--footer-copyright-text-color: ${footer.lightCopyrightTextColor};` : ''}
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

      ${footer?.darkTextColor ? `--footer-text-color: ${footer.darkTextColor};` : ''}
      ${footer?.darkHeadingColor ? `--footer-heading-color: ${footer.darkHeadingColor};` : ''}
      ${footer?.darkLinkColor ? `--footer-link-color: ${footer.darkLinkColor};` : ''}
      ${footer?.darkLinkHoverColor ? `--footer-link-hover-color: ${footer.darkLinkHoverColor};` : ''}
      ${footer?.darkCopyrightTextColor ? `--footer-copyright-text-color: ${footer.darkCopyrightTextColor};` : ''}
    }
  `

  return (
    <style dangerouslySetInnerHTML={{ __html: css }} />
  )
}
