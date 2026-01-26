"use client"

import { useTheme } from "@modules/common/components/theme-toggle"
import { useEffect, useState } from "react"
import { usePreviewConfig } from "@lib/context/preview-config-context"

interface DynamicBackgroundProps {
  children: React.ReactNode
  lightBackgroundColor?: string
  darkBackgroundColor?: string
  className?: string
  as?: "header" | "footer" | "div"
  style?: React.CSSProperties
  previewConfigKey?: "header" | "footer" | "footerCopyright"
}

export default function DynamicBackground({
  children,
  lightBackgroundColor,
  darkBackgroundColor,
  className = "",
  as = "div",
  style = {},
  previewConfigKey,
}: DynamicBackgroundProps) {
  const { theme } = useTheme()
  const { previewConfig, isPreviewMode } = usePreviewConfig()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getBackgroundColor = () => {
    if (!mounted) return undefined

    const isDark = theme === "dark"

    if (isPreviewMode && previewConfig && previewConfigKey) {
      let previewLight: string | undefined
      let previewDark: string | undefined

      if (previewConfigKey === "header") {
        previewLight = previewConfig.headerConfig?.background?.lightBackgroundColor
        previewDark = previewConfig.headerConfig?.background?.darkBackgroundColor
      } else if (previewConfigKey === "footer") {
        previewLight = previewConfig.footerConfig?.background?.lightBackgroundColor
        previewDark = previewConfig.footerConfig?.background?.darkBackgroundColor
      } else if (previewConfigKey === "footerCopyright") {
        previewLight = previewConfig.footerConfig?.copyrightBackground?.lightBackgroundColor
        previewDark = previewConfig.footerConfig?.copyrightBackground?.darkBackgroundColor
      }

      if (previewLight || previewDark) {
        return isDark ? (previewDark || previewLight) : (previewLight || previewDark)
      }
    }

    const hasCustomBackground = lightBackgroundColor || darkBackgroundColor
    if (!hasCustomBackground) return undefined

    return isDark
      ? (darkBackgroundColor || lightBackgroundColor)
      : (lightBackgroundColor || darkBackgroundColor)
  }

  const backgroundColor = getBackgroundColor()
  const Component = as
  const combinedStyle = backgroundColor 
    ? { backgroundColor, ...style }
    : style

  return (
    <Component className={className} style={combinedStyle}>
      {children}
    </Component>
  )
}
