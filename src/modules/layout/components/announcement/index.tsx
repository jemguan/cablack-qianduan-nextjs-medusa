"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import type { AnnouncementProps } from "./types"

/**
 * Announcement 组件
 * 用于在 Footer 中显示公告信息
 */
export function Announcement({
  text,
  link,
  linkText,
  imageUrl,
  lightLogoUrl,
  darkLogoUrl,
  imageSizePx = 20,
  className,
}: AnnouncementProps) {
  if (!text) return null

  const displayImageUrl = imageUrl || lightLogoUrl
  const imageSize = `${imageSizePx}px`

  return (
    <div
      className={cn(
        "w-full bg-muted border border-border rounded-md py-3 px-4",
        className
      )}
    >
      <div className="flex items-center justify-start gap-2 text-sm text-foreground">
        {displayImageUrl && (
          <div className="flex-shrink-0 relative" style={{ width: imageSize, height: imageSize }}>
            {darkLogoUrl ? (
              <>
                <img
                  src={lightLogoUrl || displayImageUrl}
                  alt="Announcement"
                  className="dark:hidden object-contain"
                  style={{ width: imageSize, height: imageSize }}
                />
                <img
                  src={darkLogoUrl}
                  alt="Announcement"
                  className="hidden dark:block object-contain"
                  style={{ width: imageSize, height: imageSize }}
                />
              </>
            ) : (
              <img
                src={displayImageUrl}
                alt="Announcement"
                className="object-contain"
                style={{ width: imageSize, height: imageSize }}
              />
            )}
          </div>
        )}

        {/* 文字内容 */}
        <span className="flex-1 text-left">{text}</span>
        {link && (
          <Link
            href={link}
            className="font-medium underline hover:no-underline transition-all flex-shrink-0"
          >
            {linkText || "了解更多"}
          </Link>
        )}
      </div>
    </div>
  )
}

