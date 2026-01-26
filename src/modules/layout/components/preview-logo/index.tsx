"use client"

import Image from "next/image"
import { usePreviewConfig } from "@lib/context/preview-config-context"

interface LogoConfig {
  lightLogoUrl?: string
  darkLogoUrl?: string
  logoAlt?: string
  mobileHeightPx?: number
  desktopHeightPx?: number
}

interface PreviewLogoProps {
  serverConfig: LogoConfig | undefined
  type: "header" | "footer"
}

export default function PreviewLogo({ serverConfig, type }: PreviewLogoProps) {
  const { previewConfig, isPreviewMode } = usePreviewConfig()

  const getLogoConfig = (): LogoConfig | undefined => {
    if (isPreviewMode && previewConfig) {
      const config = type === "header" 
        ? previewConfig.headerConfig?.logo 
        : previewConfig.footerConfig?.logo
      if (config?.lightLogoUrl || config?.darkLogoUrl) {
        return config
      }
    }
    return serverConfig
  }

  const logo = getLogoConfig()
  
  const hasLightLogo = logo?.lightLogoUrl && logo.lightLogoUrl.trim() !== ''
  const hasDarkLogo = logo?.darkLogoUrl && logo.darkLogoUrl.trim() !== ''

  if (!hasLightLogo && !hasDarkLogo) return null

  const mobileHeight = logo?.mobileHeightPx || 32
  const desktopHeight = logo?.desktopHeightPx || 40

  return (
    <>
      {hasLightLogo && (
        <div 
          className="logo-light-container relative w-auto dark:hidden"
          style={{ height: `${mobileHeight}px` }}
        >
          <Image
            src={logo.lightLogoUrl!}
            alt={logo.logoAlt || "Logo"}
            width={120}
            height={mobileHeight}
            priority
            unoptimized={true}
            className="w-auto h-full object-contain"
            sizes="120px"
          />
        </div>
      )}
      {hasDarkLogo && (
        <div 
          className="logo-dark-container relative w-auto hidden dark:block"
          style={{ height: `${mobileHeight}px` }}
        >
          <Image
            src={logo.darkLogoUrl!}
            alt={logo.logoAlt || "Logo"}
            width={120}
            height={mobileHeight}
            priority
            unoptimized={true}
            className="w-auto h-full object-contain"
            sizes="120px"
          />
        </div>
      )}
      {hasLightLogo && !hasDarkLogo && (
        <div 
          className="logo-fallback-container relative w-auto hidden dark:block"
          style={{ height: `${mobileHeight}px` }}
        >
          <Image
            src={logo.lightLogoUrl!}
            alt={logo.logoAlt || "Logo"}
            width={120}
            height={mobileHeight}
            priority
            unoptimized={true}
            className="w-auto h-full object-contain"
            sizes="120px"
          />
        </div>
      )}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (min-width: 768px) {
            .logo-light-container,
            .logo-dark-container,
            .logo-fallback-container {
              height: ${desktopHeight}px !important;
            }
          }
        `
      }} />
    </>
  )
}
