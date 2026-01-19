"use client"

import React from "react"

interface BackgroundLayerProps {
  headerHeight: number
  backgroundZIndex: number
  backgroundVideo?: string
  backgroundImage?: string
  backgroundVideoPoster?: string
  backgroundVideoAutoplay?: boolean
  backgroundVideoLoop?: boolean
  backgroundVideoMuted?: boolean
  backgroundImageAlt?: string
  backgroundImageOpacity: number
  backgroundOpacity: number
  overlayOpacity: number
  isComponentVisible: boolean
  backgroundVideoRef: React.RefObject<HTMLVideoElement | null>
}

/**
 * 背景层组件
 * 渲染背景视频/图片和遮罩层
 */
export function BackgroundLayer({
  headerHeight,
  backgroundZIndex,
  backgroundVideo,
  backgroundImage,
  backgroundVideoPoster,
  backgroundVideoAutoplay = true,
  backgroundVideoLoop = true,
  backgroundVideoMuted = true,
  backgroundImageAlt,
  backgroundImageOpacity,
  backgroundOpacity,
  overlayOpacity,
  isComponentVisible,
  backgroundVideoRef,
}: BackgroundLayerProps) {
  return (
    <div
      className="fixed left-0 right-0 w-full"
      style={{
        top: `${headerHeight}px`,
        height: `calc(100vh - ${headerHeight}px)`,
        zIndex: backgroundZIndex ?? -1,
      }}
    >
      {backgroundVideo && backgroundVideo.trim() && isComponentVisible ? (
        <video
          ref={backgroundVideoRef}
          src={backgroundVideo}
          poster={
            backgroundVideoPoster && backgroundVideoPoster.trim()
              ? backgroundVideoPoster
              : undefined
          }
          autoPlay={backgroundVideoAutoplay && isComponentVisible}
          loop={backgroundVideoLoop}
          muted={backgroundVideoMuted}
          playsInline
          preload="metadata"
          aria-label={backgroundImageAlt || "Collage Hero Background Video"}
          className="w-full h-full object-cover will-change-opacity"
          style={{
            opacity: backgroundOpacity * backgroundImageOpacity,
          }}
        >
          <track kind="captions" />
        </video>
      ) : backgroundImage && backgroundImage.trim() && isComponentVisible ? (
        <img
          src={backgroundImage}
          alt={backgroundImageAlt || "Collage Hero Background"}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="w-full h-full object-cover will-change-opacity"
          style={{
            opacity: backgroundOpacity * backgroundImageOpacity,
          }}
        />
      ) : null}

      <div
        className="absolute inset-0 bg-background/80 will-change-opacity"
        style={{
          opacity: overlayOpacity,
        }}
      />
    </div>
  )
}
