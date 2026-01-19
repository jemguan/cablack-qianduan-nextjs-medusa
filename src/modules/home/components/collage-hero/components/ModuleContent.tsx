"use client"

import type { CollageModule } from '../types'
import type { HttpTypes } from '@medusajs/types'
import { ImageModuleComponent } from './ImageModule'
import { CollectionModuleComponent } from './CollectionModule'
import { VideoModuleComponent } from './VideoModule'
import { ProductModuleComponent } from './ProductModule'
import { TextModuleComponent } from './TextModule'

interface ModuleContentProps {
  module: CollageModule
  overlayOpacity?: number
  products?: HttpTypes.StoreProduct[]
  isMobile?: boolean
  region?: HttpTypes.StoreRegion
  priority?: boolean
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
  priority = false,
}: ModuleContentProps) {
  switch (module.type) {
    case 'image':
      return <ImageModuleComponent module={module} isMobile={isMobile} priority={priority} />
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
