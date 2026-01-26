"use client"

import { clx } from "@medusajs/ui"
import { usePreviewConfig } from "@lib/context/preview-config-context"

interface BrandConfig {
  brandNamePart1?: string
  brandNamePart1ColorClass?: string
  brandNamePart2?: string
  brandNamePart2ColorClass?: string
  brandNameSizeClass?: string
  brandNameWeightClass?: string
  brandNameTrackingClass?: string
  brandNameGapClass?: string
  showBrandName?: boolean
}

interface LogoConfig {
  lightLogoUrl?: string
  darkLogoUrl?: string
}

interface PreviewBrandNameProps {
  serverConfig?: BrandConfig
  serverLogoConfig?: LogoConfig
  type: "header" | "footer"
  fallbackName?: string
}

export function PreviewBrandName({ serverConfig, serverLogoConfig, type, fallbackName }: PreviewBrandNameProps) {
  const { previewConfig, isPreviewMode } = usePreviewConfig()

  const logoConfig = type === "header"
    ? (isPreviewMode ? previewConfig?.headerConfig?.logo : serverLogoConfig)
    : (isPreviewMode ? previewConfig?.footerConfig?.logo : serverLogoConfig)

  const hasLightLogo = logoConfig?.lightLogoUrl && logoConfig.lightLogoUrl.trim() !== ''
  const hasDarkLogo = logoConfig?.darkLogoUrl && logoConfig.darkLogoUrl.trim() !== ''
  const hasLogo = hasLightLogo || hasDarkLogo

  if (type === "header") {
    const headerBrand = (isPreviewMode ? previewConfig?.headerConfig?.brand : serverConfig) as BrandConfig | undefined
    const showBrandName = headerBrand?.showBrandName !== false
    const hasBrandName = headerBrand?.brandNamePart1 || headerBrand?.brandNamePart2

    if (showBrandName && hasBrandName) {
      return (
        <div className={clx(
          "flex items-center font-bold",
          headerBrand?.brandNameGapClass || "gap-1",
          headerBrand?.brandNameSizeClass || "text-xl",
          headerBrand?.brandNameTrackingClass || "tracking-tighter"
        )}>
          {headerBrand?.brandNamePart1 && (
            <span className={headerBrand.brandNamePart1ColorClass || "text-foreground"}>
              {headerBrand.brandNamePart1}
            </span>
          )}
          {headerBrand?.brandNamePart2 && (
            <span className={headerBrand.brandNamePart2ColorClass || "text-primary"}>
              {headerBrand.brandNamePart2}
            </span>
          )}
        </div>
      )
    }

    if (!hasLogo && !hasBrandName && fallbackName) {
      return (
        <span className="txt-compact-xlarge-plus uppercase text-foreground font-bold">
          {fallbackName}
        </span>
      )
    }

    return null
  }

  const footerBrand = isPreviewMode ? previewConfig?.footerConfig?.brand : serverConfig
  const hasBrandName = footerBrand?.brandNamePart1 || footerBrand?.brandNamePart2

  if (hasBrandName) {
    return (
      <div className="flex items-center font-bold gap-1 text-xl tracking-tighter">
        {footerBrand?.brandNamePart1 && (
          <span className={footerBrand.brandNamePart1ColorClass || "text-foreground"}>
            {footerBrand.brandNamePart1}
          </span>
        )}
        {footerBrand?.brandNamePart2 && (
          <span className={footerBrand.brandNamePart2ColorClass || "text-primary"}>
            {footerBrand.brandNamePart2}
          </span>
        )}
      </div>
    )
  }

  if (!hasLogo && !hasBrandName && fallbackName) {
    return (
      <span className="txt-compact-xlarge-plus uppercase text-foreground font-bold">
        {fallbackName}
      </span>
    )
  }

  return null
}

export default PreviewBrandName
