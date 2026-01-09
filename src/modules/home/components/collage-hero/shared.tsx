"use client"

import React, { useState, useEffect, useRef, memo } from 'react'
import { Button } from '@medusajs/ui'
import LocalizedClientLink from '@modules/common/components/localized-client-link'
import ProductPreview from '@modules/products/components/product-preview'
import { getGlassClassName, getGlassStyle } from '@lib/ui/glass-effect/utils'
import { DEFAULT_MODULE_CONFIG } from './config'
import type { CollageModule } from './types'
import type { HttpTypes } from '@medusajs/types'

// ============================================
// 动画组件
// ============================================

/**
 * 共享的动画组件 - 不使用 framer-motion 以减少包大小
 */
export const MotionDiv = memo(React.forwardRef<HTMLDivElement, {
  children?: React.ReactNode
  initial?: { opacity?: number }
  animate?: { opacity?: number }
  transition?: { duration?: number; delay?: number }
  style?: React.CSSProperties
  className?: string
  [key: string]: any
}>(({ 
  children, 
  initial, 
  animate, 
  transition,
  style,
  ...props 
}, ref) => {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, transition?.delay ? transition.delay * 1000 : 0)
    
    return () => clearTimeout(timer)
  }, [transition?.delay])
  
  const opacity = isVisible ? (animate?.opacity ?? 1) : (initial?.opacity ?? 0)
  
  return (
    <div
      ref={ref}
      {...props}
      style={{
        ...style,
        opacity,
        transition: `opacity ${transition?.duration ?? 0.8}s ease-out`,
      }}
    >
      {children}
    </div>
  )
}))

MotionDiv.displayName = 'MotionDiv'

/**
 * AnimatePresence 包装器
 */
export const AnimatePresence = ({ children }: { children: React.ReactNode }) => <>{children}</>

// ============================================
// 图标组件
// ============================================

export const Volume2Icon = memo(() => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M6.343 6.343l4.243 4.243m0 0l4.243 4.243m-4.243-4.243L6.343 17.657m4.243-4.243l4.243-4.243" />
  </svg>
))
Volume2Icon.displayName = 'Volume2Icon'

export const VolumeXIcon = memo(() => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
))
VolumeXIcon.displayName = 'VolumeXIcon'

export const PlayIcon = memo(() => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
))
PlayIcon.displayName = 'PlayIcon'

export const PauseIcon = memo(() => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
  </svg>
))
PauseIcon.displayName = 'PauseIcon'

// ============================================
// 模块组件
// ============================================

/**
 * 图片模块组件
 */
export const ImageModuleComponent = memo(function ImageModuleComponent({
  module,
  isMobile = false,
}: {
  module: Extract<CollageModule, { type: 'image' }>
  isMobile?: boolean
}) {
  const { imageUrl, alt, link, openInNewTab = DEFAULT_MODULE_CONFIG.image.openInNewTab } = module

  const hoverClass = isMobile 
    ? 'active:scale-95 duration-300' 
    : 'hover:scale-105 hover:shadow-2xl duration-500'
  const shadowClass = isMobile ? 'shadow-md' : 'shadow-lg'

  const content = (
    <div className={`cursor-pointer transition-all ${hoverClass} will-change-transform h-full w-full`}>
      <img
        src={imageUrl}
        alt={alt || 'Image Module'}
        loading="lazy"
        decoding="async"
        className={`w-full h-full object-cover rounded-lg ${shadowClass}`}
      />
    </div>
  )

  if (link) {
    if (openInNewTab) {
      return (
        <a href={link} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      )
    }
    return <LocalizedClientLink href={link}>{content}</LocalizedClientLink>
  }

  return content
})

/**
 * 产品系列模块组件
 */
export const CollectionModuleComponent = memo(function CollectionModuleComponent({
  module,
  isMobile = false,
}: {
  module: Extract<CollageModule, { type: 'collection' }>
  isMobile?: boolean
}) {
  const { collectionHandle, title, imageUrl } = module
  const collectionLink = `/collections/${collectionHandle}`

  const hoverClass = isMobile 
    ? 'active:scale-95 duration-300' 
    : 'hover:scale-105 hover:shadow-2xl duration-500'
  const titleClass = isMobile ? 'text-base drop-shadow-sm' : 'text-lg drop-shadow-md'

  return (
    <LocalizedClientLink
      href={collectionLink}
      className={`block cursor-pointer transition-all ${hoverClass} w-full h-full will-change-transform`}
    >
      <div className={`relative w-full h-full rounded-lg ${getGlassClassName(true)}`} style={getGlassStyle(true)}>
        {imageUrl && (
          <img
            src={imageUrl}
            alt={title || 'Collection'}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover rounded-lg mb-2"
          />
        )}
        {title && (
          <h3 className={`font-semibold text-foreground text-center ${titleClass}`}>
            {title}
          </h3>
        )}
      </div>
    </LocalizedClientLink>
  )
})

/**
 * 视频模块组件
 */
export const VideoModuleComponent = memo(function VideoModuleComponent({
  module,
  isMobile = false,
}: {
  module: Extract<CollageModule, { type: 'video' }>
  isMobile?: boolean
}) {
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
        } catch (e) {
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

/**
 * 主推产品模块组件
 */
export function ProductModuleComponent({
  module,
  products,
  region,
}: {
  module: Extract<CollageModule, { type: 'product' }>
  products?: HttpTypes.StoreProduct[]
  region?: HttpTypes.StoreRegion
}) {
  const { productId } = module

  if (!productId || productId.trim() === '') {
    return (
      <div className={`w-full h-full flex items-center justify-center p-4 rounded-lg ${getGlassClassName(true)}`} style={getGlassStyle(true)}>
        <div className="text-sm text-gray-500 text-center">请在产品模块配置中设置产品 ID</div>
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className={`w-full h-full flex items-center justify-center p-4 rounded-lg ${getGlassClassName(true)}`} style={getGlassStyle(true)}>
        <div className="text-sm text-gray-500 text-center">产品数据加载中...</div>
      </div>
    )
  }

  const product = products.find((p) => p.id === productId || p.handle === productId)

  if (!product) {
    return (
      <div className={`w-full h-full flex items-center justify-center p-4 rounded-lg ${getGlassClassName(true)}`} style={getGlassStyle(true)}>
        <div className="text-sm text-gray-500 text-center">
          <div>未找到产品 ID: {productId}</div>
        </div>
      </div>
    )
  }

  if (!region) {
    return (
      <div className={`w-full h-full flex items-center justify-center p-4 rounded-lg ${getGlassClassName(true)}`} style={getGlassStyle(true)}>
        <div className="text-sm text-gray-500 text-center">区域信息缺失</div>
      </div>
    )
  }

  return (
    <div className={`w-full h-full rounded-lg ${getGlassClassName(true)}`} style={getGlassStyle(true)}>
      <ProductPreview product={product} region={region} />
    </div>
  )
}

/**
 * 文字模块组件
 */
export function TextModuleComponent({
  module,
  overlayOpacity = 0,
  isMobile = false,
}: {
  module: Extract<CollageModule, { type: 'text' }>
  overlayOpacity?: number
  isMobile?: boolean
}) {
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

/**
 * 模块内容组件 - 根据模块类型渲染不同的组件
 */
export function ModuleContent({
  module,
  overlayOpacity = 0,
  products,
  isMobile = false,
  region,
}: {
  module: CollageModule
  overlayOpacity?: number
  products?: HttpTypes.StoreProduct[]
  isMobile?: boolean
  region?: HttpTypes.StoreRegion
}) {
  switch (module.type) {
    case 'image':
      return <ImageModuleComponent module={module} isMobile={isMobile} />
    case 'collection':
      return <CollectionModuleComponent module={module} isMobile={isMobile} />
    case 'video':
      return <VideoModuleComponent module={module} isMobile={isMobile} />
    case 'product':
      return <ProductModuleComponent module={module} products={products} region={region} />
    case 'text':
      return <TextModuleComponent module={module} overlayOpacity={overlayOpacity} isMobile={isMobile} />
    default:
      return null
  }
}
