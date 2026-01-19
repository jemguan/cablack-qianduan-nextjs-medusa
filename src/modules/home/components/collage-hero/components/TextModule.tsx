"use client"

import { Button } from '@medusajs/ui'
import LocalizedClientLink from '@modules/common/components/localized-client-link'
import { getGlassClassName, getGlassStyle } from '@lib/ui/glass-effect/utils'
import type { CollageModule } from '../types'

interface TextModuleProps {
  module: Extract<CollageModule, { type: 'text' }>
  overlayOpacity?: number
  isMobile?: boolean
}

/**
 * 文字模块组件
 */
export function TextModuleComponent({
  module,
  overlayOpacity = 0,
  isMobile = false,
}: TextModuleProps) {
  const {
    title,
    subtitle,
    content,
    textAlign = 'center',
    titleColor = 'text-foreground',
    subtitleColor = 'text-muted-foreground',
    contentColor = 'text-foreground',
    backgroundColor,
    link,
    openInNewTab = false,
    showButton = false,
    buttonText = '了解更多',
    buttonLink,
    buttonOpenInNewTab = false,
    desktopTitleSize,
    desktopSubtitleSize,
    desktopContentSize,
    mobileTitleSize,
    mobileSubtitleSize,
    mobileContentSize,
  } = module
  const position = isMobile
    ? (module.mobilePosition || module.position || {})
    : (module.position || {})

  const textAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[textAlign]

  const textOpacity = Math.max(0, 1 - overlayOpacity)

  // 移动端和桌面端的差异
  const padding = isMobile ? 'p-4' : 'p-6'
  const subtitleMargin = isMobile ? 'mb-2' : 'mb-3'
  const buttonSize = isMobile ? 'small' : undefined

  const buttonElement = showButton && buttonLink ? (
    <div className={`mt-4 ${textAlign === 'center' ? 'flex justify-center' : textAlign === 'right' ? 'flex justify-end' : 'flex justify-start'}`}>
      {buttonOpenInNewTab ? (
        <Button asChild variant="primary" size={buttonSize as any}>
          <a href={buttonLink} target="_blank" rel="noopener noreferrer">
            {buttonText}
          </a>
        </Button>
      ) : (
        <Button asChild variant="primary" size={buttonSize as any}>
          <LocalizedClientLink href={buttonLink}>
            {buttonText}
          </LocalizedClientLink>
        </Button>
      )}
    </div>
  ) : null

  const backgroundClass = backgroundColor
    ? `${backgroundColor} rounded-lg ${padding} ${textAlignClass} transition-opacity duration-300`
    : `${getGlassClassName(true)} rounded-lg ${padding} ${textAlignClass} transition-opacity duration-300`

  const hasExplicitHeight = position.height && position.height !== 'auto'
  const backgroundStyle = backgroundColor
    ? {
        width: '100%',
        ...(hasExplicitHeight && { minHeight: '100%' })
      }
    : {
        width: '100%',
        ...(hasExplicitHeight && { minHeight: '100%' }),
        ...getGlassStyle(true)
      }

  const titleSize = isMobile
    ? (mobileTitleSize || desktopTitleSize || "text-xl")
    : (desktopTitleSize || "text-2xl")
  const subtitleSize = isMobile
    ? (mobileSubtitleSize || desktopSubtitleSize || "text-base")
    : (desktopSubtitleSize || "text-lg")
  const contentSize = isMobile
    ? (mobileContentSize || desktopContentSize || "text-sm")
    : (desktopContentSize || "text-base")

  const textContent = (
    <div
      className={backgroundClass}
      style={backgroundStyle}
    >
      {title && (
        <h2 className={`${titleSize} font-bold mb-2 ${titleColor}`}>{title}</h2>
      )}
      {subtitle && (
        <h3 className={`${subtitleSize} font-semibold ${subtitleMargin} ${subtitleColor}`}>
          {subtitle}
        </h3>
      )}
      {content && (
        <p className={`${contentSize} leading-relaxed ${contentColor}`}>{content}</p>
      )}
      {buttonElement}
    </div>
  )

  const textModuleStyle: React.CSSProperties = {
    opacity: textOpacity,
    ...(textOpacity <= 0 && { pointerEvents: 'none' as const }),
  }

  if (link) {
    if (openInNewTab) {
      return (
        <a href={link} target="_blank" rel="noopener noreferrer" className="block" style={textModuleStyle}>
          {textContent}
        </a>
      )
    }
    return <LocalizedClientLink href={link} style={textModuleStyle}>{textContent}</LocalizedClientLink>
  }

  return <div style={textModuleStyle}>{textContent}</div>
}
