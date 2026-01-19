"use client"

import React, { useState, useEffect, useRef } from "react"
import type { CollageModule } from "../types"
import type { HttpTypes } from "@medusajs/types"
import { MotionDiv } from "./MotionDiv"
import { ModuleContent } from "./ModuleContent"

interface ModuleRendererProps {
  module: CollageModule
  index: number
  overlayOpacity?: number
  products?: HttpTypes.StoreProduct[]
  isMobile?: boolean
  isComponentVisible?: boolean
  blockHeight?: string
  region?: HttpTypes.StoreRegion
}

/**
 * 模块渲染器（带懒加载）
 */
export function ModuleRenderer({
  module,
  index,
  overlayOpacity = 0,
  products,
  isMobile = false,
  isComponentVisible = true,
  blockHeight = "220vh",
  region,
}: ModuleRendererProps) {
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof window === "undefined") {
      return
    }

    if (!isComponentVisible) {
      return
    }

    const position = isMobile
      ? module.mobilePosition || module.position || {}
      : module.position || {}

    const topValue = position.top
    if (topValue && typeof topValue === "string") {
      const topVh = parseFloat(topValue.replace("vh", ""))
      if (!isNaN(topVh) && topVh < 100) {
        setIsVisible(true)
        return
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: "200px",
        threshold: 0.01,
      }
    )

    observer.observe(container)

    return () => {
      observer.disconnect()
    }
  }, [module, isMobile, isComponentVisible])

  const rawPosition = isMobile
    ? module.mobilePosition || module.position || {}
    : module.position || {}

  const position = {
    ...(rawPosition.top !== undefined ? { top: rawPosition.top } : {}),
    ...(rawPosition.left !== undefined ? { left: rawPosition.left } : {}),
    ...(rawPosition.right !== undefined ? { right: rawPosition.right } : {}),
    ...(rawPosition.bottom !== undefined ? { bottom: rawPosition.bottom } : {}),
    ...(rawPosition.width !== undefined ? { width: rawPosition.width } : {}),
    ...(rawPosition.height !== undefined ? { height: rawPosition.height } : {}),
    ...(rawPosition.transform !== undefined
      ? { transform: rawPosition.transform }
      : {}),
  }

  const isTextModule = module.type === "text"
  const isImageModule = module.type === "image"
  const isCollectionModule = module.type === "collection"
  const isVideoModule = module.type === "video"
  const isProductModule = module.type === "product"
  const textModuleSticky = isTextModule && module.stickyOnHero !== false
  const moduleZIndex = isTextModule ? 5 : 10
  const modulePosition = textModuleSticky
    ? ("fixed" as const)
    : ("absolute" as const)

  const defaultPosition =
    module.type === "text"
      ? {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: isMobile ? "90%" : "600px",
        }
      : {}

  const hasTop =
    position.top !== undefined && position.top !== null && position.top !== ""
  const hasLeft =
    position.left !== undefined &&
    position.left !== null &&
    position.left !== ""
  const shouldUseCenterTransform =
    (isTextModule ||
      isImageModule ||
      isCollectionModule ||
      isVideoModule ||
      isProductModule) &&
    !position.transform &&
    (hasTop || hasLeft || (!hasTop && !hasLeft && defaultPosition.transform))

  const finalTop = hasTop ? position.top : defaultPosition.top || "auto"
  const finalLeft = hasLeft ? position.left : defaultPosition.left || "auto"

  if (!isComponentVisible) {
    return null
  }

  if (isMobile && module.mobileEnabled === false) {
    return null
  }

  if (!isMobile && module.desktopEnabled === false) {
    return null
  }

  const style: Record<string, string | number> = {
    position: modulePosition,
    width: position.width || defaultPosition.width || "auto",
    height: position.height || "auto",
    zIndex: moduleZIndex,
  }

  if (position.transform) {
    style.transform = position.transform
  }

  if (finalTop && finalTop !== "auto") {
    style.top = finalTop
  }
  if (finalLeft && finalLeft !== "auto") {
    style.left = finalLeft
  }

  if (
    (!finalTop || finalTop === "auto") &&
    position.right !== undefined &&
    position.right !== null &&
    position.right !== ""
  ) {
    style.right = position.right
  }
  if (
    (!finalTop || finalTop === "auto") &&
    position.bottom !== undefined &&
    position.bottom !== null &&
    position.bottom !== ""
  ) {
    style.bottom = position.bottom
  }

  delete (style as any).inset

  // 处理 transform：如果 style 中已有 transform，需要合并
  let finalTransform = style.transform || ""
  if (shouldUseCenterTransform) {
    const centerTransform = `translate(-50%, -50%)`
    if (finalTransform) {
      finalTransform = `${centerTransform} ${finalTransform}`
    } else {
      finalTransform = centerTransform
    }
  }

  const finalStyle = {
    ...style,
    ...(finalTransform ? { transform: finalTransform } : {}),
  }

  const animationDuration = isMobile ? 0.6 : 0.8

  return (
    <MotionDiv
      ref={containerRef}
      style={finalStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{
        duration: animationDuration,
        delay: index * 0.1,
      }}
    >
      {isVisible ? (
        <ModuleContent
          module={module}
          overlayOpacity={overlayOpacity}
          products={products}
          isMobile={isMobile}
          region={region}
        />
      ) : (
        <div style={{ width: "100%", height: "100%", minHeight: "100px" }} />
      )}
    </MotionDiv>
  )
}
