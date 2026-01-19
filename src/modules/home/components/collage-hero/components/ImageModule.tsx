"use client"

import { memo } from 'react'
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

  const content = (
    <div className={`cursor-pointer transition-all ${hoverClass} will-change-transform h-full w-full`}>
      <img
        src={imageUrl}
        alt={alt || 'Image Module'}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
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
