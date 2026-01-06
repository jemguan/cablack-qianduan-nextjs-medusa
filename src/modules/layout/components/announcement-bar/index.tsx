"use client"

import React, { useState, useEffect } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Announcement = {
  id: string
  text: string
  link?: string | null
}

interface AnnouncementBarProps {
  announcements: Announcement[]
}

const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ announcements }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  // 自动轮播（5秒切换）
  useEffect(() => {
    if (announcements.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [announcements.length])

  if (!announcements || announcements.length === 0) {
    return null
  }

  const currentAnnouncement = announcements[currentIndex]

  return (
    <div className="bg-secondary text-secondary-foreground py-2 text-sm font-medium overflow-hidden relative z-[60] border-b border-border">
      <div className="w-full text-center px-4">
        {currentAnnouncement.link ? (
          <LocalizedClientLink
            href={currentAnnouncement.link}
            className="hover:underline transition-opacity hover:opacity-80"
          >
            {currentAnnouncement.text}
          </LocalizedClientLink>
        ) : (
          <span>{currentAnnouncement.text}</span>
        )}
      </div>
    </div>
  )
}

export default AnnouncementBar

