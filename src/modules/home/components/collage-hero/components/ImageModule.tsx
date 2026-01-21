"use client"

import { memo } from 'react'
import Image from 'next/image'
import LocalizedClientLink from '@modules/common/components/localized-client-link'
import { DEFAULT_MODULE_CONFIG } from '../config'
import type { CollageModule } from '../types'

interface ImageModuleProps {
  module: Extract<CollageModule, { type: 'image' }>
  isMobile?: boolean
  priority?: boolean
}

/**
 * 图片模块组件
 */
export const ImageModuleComponent = memo(function ImageModuleComponent({
  module,
  isMobile = false,
  priority = false,
}: ImageModuleProps) {
  const { imageUrl, alt, link, openInNewTab = DEFAULT_MODULE_CONFIG.image.openInNewTab } = module

  const hoverClass = isMobile
    ? 'active:scale-95 duration-300'
    : 'hover:scale-105 hover:shadow-2xl duration-500'
  const shadowClass = isMobile ? 'shadow-md' : 'shadow-lg'

  // 根据设备计算响应式 sizes
  const sizes = isMobile
    ? "100vw"
    : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"

  const content = (
    <div className={`cursor-pointer transition-all ${hoverClass} will-change-transform h-full w-full relative`}>
      <Image
        src={imageUrl}
        alt={alt || 'Image Module'}
        fill
        sizes={sizes}
        priority={priority}
        quality={isMobile ? 70 : 80}
        className={`object-cover rounded-lg ${shadowClass}`}
      />
    </div>
  )

  if (link) {
    if (openInNewTab) {
      return (
        <a href={link} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
          {content}
        </a>
      )
    }
    return <LocalizedClientLink href={link} className="block h-full w-full">{content}</LocalizedClientLink>
  }

  return content
})
