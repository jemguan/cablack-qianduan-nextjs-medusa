"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { usePreviewConfig } from "@lib/context/preview-config-context"
import type { AnnouncementProps } from "./types"

export function Announcement({
  title: serverTitle,
  subtitle: serverSubtitle,
  text: serverText,
  link: serverLink,
  linkText: serverLinkText,
  imageUrl: serverImageUrl,
  lightLogoUrl: serverLightLogoUrl,
  darkLogoUrl: serverDarkLogoUrl,
  paymentMethods: serverPaymentMethods,
  className,
}: AnnouncementProps) {
  const { previewConfig, isPreviewMode } = usePreviewConfig()

  const announcement = isPreviewMode ? previewConfig?.footerConfig?.announcement : null
  
  const title = isPreviewMode && announcement ? announcement.title : serverTitle
  const subtitle = isPreviewMode && announcement ? announcement.subtitle : serverSubtitle
  const text = isPreviewMode && announcement ? announcement.text : serverText
  const link = isPreviewMode && announcement ? announcement.link : serverLink
  const linkText = isPreviewMode && announcement ? announcement.linkText : serverLinkText
  const imageUrl = isPreviewMode && announcement ? announcement.imageUrl : serverImageUrl
  const lightLogoUrl = isPreviewMode && announcement ? announcement.lightLogoUrl : serverLightLogoUrl
  const darkLogoUrl = isPreviewMode && announcement ? announcement.darkLogoUrl : serverDarkLogoUrl
  const paymentMethods = isPreviewMode && announcement ? announcement.paymentMethods : serverPaymentMethods

  const hasContent = title || subtitle || text || imageUrl || lightLogoUrl
  if (!hasContent) return null

  const displayImageUrl = imageUrl || lightLogoUrl

  return (
    <div
      className={cn(
        "text-sm",
        className
      )}
      style={{ color: 'var(--footer-text-color)' }}
    >
      {displayImageUrl && (
        <div className="w-full mb-3">
          {darkLogoUrl ? (
            <>
              <img
                src={lightLogoUrl || displayImageUrl}
                alt="Announcement"
                className="dark:hidden w-full h-auto object-contain"
              />
              <img
                src={darkLogoUrl}
                alt="Announcement"
                className="hidden dark:block w-full h-auto object-contain"
              />
            </>
          ) : (
            <img
              src={displayImageUrl}
              alt="Announcement"
              className="w-full h-auto object-contain"
            />
          )}
        </div>
      )}

      {title && (
        <h3 className="block text-center text-lg font-semibold mb-1 text-[var(--footer-heading-color)]">{title}</h3>
      )}

      {subtitle && (
        <h4 className="block text-center text-base font-medium mb-2 text-[var(--footer-text-color)]">{subtitle}</h4>
      )}

      {text && (
        <p className="block text-center mb-2 text-[var(--footer-text-color)]">{text}</p>
      )}

      {link && (
        <Link
          href={link}
          className="block text-center font-medium underline hover:no-underline transition-all mb-3 text-[var(--footer-link-color)] hover:text-[var(--footer-link-hover-color)]"
        >
          {linkText || "了解更多"}
        </Link>
      )}

      {paymentMethods && paymentMethods.length > 0 && (() => {
        const MAX_VISIBLE = 8
        const validMethods = paymentMethods.filter(method => {
          return method.iconUrl || method.lightIconUrl || method.darkIconUrl
        })
        const visibleMethods = validMethods.slice(0, MAX_VISIBLE)
        const remainingCount = validMethods.length - MAX_VISIBLE
        
        return (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'color-mix(in srgb, var(--footer-text-color) 30%, transparent)' }}>
            <div className="grid grid-cols-4 small:grid-cols-8 gap-1.5">
              {visibleMethods.map((method, index) => {
                const iconSrc = method.iconUrl || method.lightIconUrl || method.darkIconUrl
                
                return (
                  <div
                    key={index}
                    className="p-1 flex items-center justify-center aspect-[3/2]"
                  >
                    <img
                      src={iconSrc}
                      alt={method.name}
                      title={method.name}
                      className="max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.parentElement!.style.display = 'none'
                      }}
                    />
                  </div>
                )
              })}
            </div>
            {remainingCount > 0 && (
              <p 
                className="text-xs text-center mt-2 text-[var(--footer-text-color)] opacity-70"
                title={validMethods.slice(MAX_VISIBLE).map(m => m.name).join(', ')}
              >
                +{remainingCount} 更多
              </p>
            )}
          </div>
        )
      })()}
    </div>
  )
}

