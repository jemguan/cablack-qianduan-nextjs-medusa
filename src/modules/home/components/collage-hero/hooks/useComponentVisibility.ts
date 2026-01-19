"use client"

import { useState, useEffect, useRef } from "react"

interface UseComponentVisibilityProps {
  contentRef: React.RefObject<HTMLDivElement | null>
  backgroundVideoRef: React.RefObject<HTMLVideoElement | null>
  backgroundVideo?: string
  backgroundImage?: string
}

interface UseComponentVisibilityReturn {
  isComponentVisible: boolean
}

/**
 * 组件可见性 Hook
 * 使用 Intersection Observer 检测组件是否在视窗内
 * 并管理背景视频/图片的加载和卸载
 */
export function useComponentVisibility({
  contentRef,
  backgroundVideoRef,
  backgroundVideo,
  backgroundImage,
}: UseComponentVisibilityProps): UseComponentVisibilityReturn {
  const [isComponentVisible, setIsComponentVisible] = useState(true)
  const componentObserverRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const container = contentRef.current
    if (!container || typeof window === "undefined") {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isVisible = entry.isIntersecting
          setIsComponentVisible(isVisible)

          if (isVisible) {
            if (backgroundVideoRef.current && backgroundVideo) {
              const video = backgroundVideoRef.current
              if (!video.src || video.src === "") {
                video.src = backgroundVideo
              }
            }
            const backgroundImg = container.parentElement?.querySelector("img")
            if (
              backgroundImg &&
              backgroundImage &&
              (!backgroundImg.src || backgroundImg.src === "")
            ) {
              backgroundImg.src = backgroundImage
            }
          } else {
            if (backgroundVideoRef.current) {
              const video = backgroundVideoRef.current
              if (!video.paused) {
                video.pause()
              }
              try {
                video.currentTime = 0
                if ("load" in video && typeof video.load === "function") {
                  video.load()
                }
                video.src = ""
                video.removeAttribute("src")
              } catch {
                // 某些浏览器可能不支持
              }
            }

            const backgroundImg = container.parentElement?.querySelector("img")
            if (backgroundImg && backgroundImg.src) {
              backgroundImg.src = ""
              backgroundImg.removeAttribute("src")
            }
          }
        })
      },
      {
        threshold: 0,
        rootMargin: "-200px",
      }
    )

    observer.observe(container)
    componentObserverRef.current = observer

    return () => {
      observer.disconnect()
      componentObserverRef.current = null
    }
  }, [backgroundVideo, backgroundImage, contentRef, backgroundVideoRef])

  return { isComponentVisible }
}
