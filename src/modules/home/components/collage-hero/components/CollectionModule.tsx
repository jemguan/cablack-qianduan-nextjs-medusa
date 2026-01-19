"use client"

import { memo } from 'react'
import LocalizedClientLink from '@modules/common/components/localized-client-link'
import { getGlassClassName, getGlassStyle } from '@lib/ui/glass-effect/utils'
import type { CollageModule } from '../types'

interface CollectionModuleProps {
  module: Extract<CollageModule, { type: 'collection' }>
  isMobile?: boolean
}

/**
 * 产品系列模块组件
 */
export const CollectionModuleComponent = memo(function CollectionModuleComponent({
  module,
  isMobile = false,
}: CollectionModuleProps) {
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
