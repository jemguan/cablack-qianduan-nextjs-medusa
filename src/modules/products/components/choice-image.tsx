"use client"

import Image from "next/image"
import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { getImageUrl, generateBlurPlaceholder } from "@lib/util/image"
import { clx } from "@medusajs/ui"

type ChoiceImageProps = {
  imageUrl: string | null | undefined
  alt: string
  /** 是否选中 - 选中时提高加载优先级 */
  isSelected?: boolean
  /** 是否是第一个可见项 - 进一步提高优先级 */
  isFirstVisible?: boolean
  /** 自定义尺寸类名 */
  sizeClassName?: string
  /** 是否圆形 */
  rounded?: boolean
  /** 是否显示边框 */
  showBorder?: boolean
  /** 边框颜色（选中状态） */
  borderColorSelected?: string
  /** 自定义样式 */
  className?: string
}

/**
 * 优化的选项图片组件
 * 
 * 优化策略：
 * 1. 视口检测 - 只在图片进入视口时加载
 * 2. 优先级管理 - 选中项和首个可见项优先加载
 * 3. 占位符 - 防止布局偏移
 * 4. 去重处理 - 避免同一图片重复加载请求
 */
export function ChoiceImage({
  imageUrl,
  alt,
  isSelected = false,
  isFirstVisible = false,
  sizeClassName = "w-full aspect-square",
  rounded = true,
  showBorder = true,
  borderColorSelected = "border-ui-border-interactive",
  className = "",
}: ChoiceImageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [error, setError] = useState(false)

  // 处理图片 URL
  const processedUrl = useMemo(() => {
    if (!imageUrl) return null
    return getImageUrl(imageUrl)
  }, [imageUrl])

  // 视口检测 - 使用 IntersectionObserver
  useEffect(() => {
    if (!processedUrl || hasLoaded) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        // 提前 200px 加载，提升用户体验
        rootMargin: "200px",
        // 只触发一次
        threshold: 0,
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [processedUrl, hasLoaded])

  // 加载成功回调
  const handleLoad = useCallback(() => {
    setHasLoaded(true)
  }, [])

  // 加载失败回调
  const handleError = useCallback(() => {
    setError(true)
    setHasLoaded(true) // 标记为已尝试加载，避免重复尝试
  }, [])

  // 如果没有图片 URL，返回 null
  if (!processedUrl) {
    return null
  }

  // 计算加载优先级
  // 优先级：选中项 > 首个可见项 > 普通项
  const priority = isSelected || isFirstVisible

  // 确定是否应该加载
  // 选中项立即加载，非选中项等进入视口再加载
  const shouldLoad = priority || isInView

  // 渲染状态
  const isLoading = !hasLoaded && shouldLoad
  const showPlaceholder = isLoading || !hasLoaded

  return (
    <div
      ref={containerRef}
      className={clx(
        "relative overflow-hidden bg-ui-bg-base",
        sizeClassName,
        rounded && "rounded-full",
        showBorder && isSelected && borderColorSelected,
        showBorder && !isSelected && "border border-transparent",
        className
      )}
    >
      {/* 占位符 - 在图片加载前显示 */}
      {showPlaceholder && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-ui-bg-subtle"
          style={{
            backgroundImage: `url("${generateBlurPlaceholder()}")`,
            backgroundSize: "cover",
          }}
        >
          {/* 加载骨架动画 */}
          <div className="w-1/2 h-1/2 bg-ui-bg-base/50 rounded animate-pulse" />
        </div>
      )}

      {/* 实际图片 - 只在应该加载时渲染 */}
      {shouldLoad && (
        <Image
          src={processedUrl}
          alt={alt}
          fill
          className={clx(
            "object-cover transition-opacity duration-300",
            hasLoaded ? "opacity-100" : "opacity-0"
          )}
          sizes="(max-width: 639px) 33vw, 16vw"
          priority={priority}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* 错误状态 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-ui-bg-subtle text-ui-fg-muted">
          <svg
            className="w-1/2 h-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  )
}

/**
 * 图片 URL 去重缓存
 * 避免同一组件树中重复请求相同图片
 */
const imageUrlCache = new Map<string, string | null>()

/**
 * 带缓存的图片 URL 获取
 * 同一图片 URL 在同一会话中只处理一次
 */
export function getCachedImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  
  const cacheKey = url.trim()
  
  if (!imageUrlCache.has(cacheKey)) {
    imageUrlCache.set(cacheKey, getImageUrl(url))
  }
  
  return imageUrlCache.get(cacheKey)!
}

/**
 * 清除图片 URL 缓存
 * 在需要时调用（如切换产品后）
 */
export function clearImageUrlCache() {
  imageUrlCache.clear()
}

/**
 * 批量获取去重后的图片 URL
 * 返回 Map，便于在组件中使用
 */
export function getDeduplicatedImageUrls<T extends { image_url?: string | null }>(
  items: T[],
  getId: (item: T) => string
): Map<string, string | null> {
  const result = new Map<string, string | null>()
  
  items.forEach((item) => {
    const id = getId(item)
    const cachedUrl = getCachedImageUrl(item.image_url)
    result.set(id, cachedUrl)
  })
  
  return result
}

export default ChoiceImage
