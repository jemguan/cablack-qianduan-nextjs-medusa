"use client"

import { memo, useRef, useState, useEffect } from 'react'
import { DEFAULT_MODULE_CONFIG } from '../config'
import type { CollageModule } from '../types'
import { Volume2Icon, VolumeXIcon, PlayIcon, PauseIcon } from './Icons'

interface VideoModuleProps {
  module: Extract<CollageModule, { type: 'video' }>
  isMobile?: boolean
}

/**
 * 视频模块组件
 */
export const VideoModuleComponent = memo(function VideoModuleComponent({
  module,
  isMobile = false,
}: VideoModuleProps) {
  const {
    videoUrl,
    posterUrl,
    autoplay = DEFAULT_MODULE_CONFIG.video.autoplay,
    loop = DEFAULT_MODULE_CONFIG.video.loop,
    muted: initialMuted = DEFAULT_MODULE_CONFIG.video.muted,
    controls = DEFAULT_MODULE_CONFIG.video.controls,
  } = module
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const [isMuted, setIsMuted] = useState(initialMuted)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    const container = containerRef.current

    if (!video || !container || typeof window === 'undefined') {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (autoplay && video.paused) {
              video.play().catch(() => {
                // 静默处理播放错误
              })
            }
          } else {
            if (!video.paused) {
              video.pause()
            }
          }
        })
      },
      {
        threshold: 0.5,
        rootMargin: '50px',
      }
    )

    observer.observe(container)
    observerRef.current = observer

    return () => {
      if (video) {
        video.pause()
        try {
          video.currentTime = 0
          if ('load' in video && typeof video.load === 'function') {
            video.load()
          }
        } catch {
          // 静默处理清理错误
        }
      }
      observer.disconnect()
      observerRef.current = null
    }
  }, [autoplay])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  const toggleMute = () => {
    const video = videoRef.current
    if (video) {
      video.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play().catch(() => {
        // 静默处理播放错误
      })
    } else {
      video.pause()
    }
  }

  if (!videoUrl || videoUrl.trim() === '') {
    return null
  }

  const shadowClass = isMobile ? 'shadow-md' : 'shadow-lg'

  return (
    <div ref={containerRef} className={`relative overflow-hidden rounded-lg ${shadowClass} w-full h-full group`}>
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl || undefined}
        loop={loop}
        muted={isMuted}
        controls={controls}
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
      >
        <track kind="captions" />
        您的浏览器不支持视频播放。
      </video>

      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <button
          onClick={toggleMute}
          className="p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-colors"
          aria-label={isMuted ? '取消静音' : '静音'}
        >
          {isMuted ? <VolumeXIcon /> : <Volume2Icon />}
        </button>

        <button
          onClick={togglePlayPause}
          className="p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-colors"
          aria-label={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>
    </div>
  )
})
