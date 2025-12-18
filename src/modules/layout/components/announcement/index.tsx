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
  className,
}: AnnouncementProps) {
  if (!text) return null

  // 确定使用的图片 URL（优先使用 imageUrl，然后是 lightLogoUrl）
  const displayImageUrl = imageUrl || lightLogoUrl

  return (
    <div
      className={cn(
        "w-full bg-muted border border-border rounded-md py-3 px-4",
        className
      )}
    >
      <div className="flex items-center justify-start gap-2 text-sm text-foreground">
        {/* 图片/Logo */}
        {displayImageUrl && (
          <div className="flex-shrink-0 relative w-5 h-5">
            {darkLogoUrl ? (
              <>
                <img
                  src={lightLogoUrl || displayImageUrl}
                  alt="Announcement"
                  className="dark:hidden w-5 h-5 object-contain"
                />
                <img
                  src={darkLogoUrl}
                  alt="Announcement"
                  className="hidden dark:block w-5 h-5 object-contain"
                />
              </>
            ) : (
              <img
                src={displayImageUrl}
                alt="Announcement"
                className="w-5 h-5 object-contain"
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

