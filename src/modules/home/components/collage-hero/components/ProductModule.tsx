"use client"

import { getGlassClassName, getGlassStyle } from '@lib/ui/glass-effect/utils'
import ProductPreview from '@modules/products/components/product-preview'
import type { CollageModule } from '../types'
import type { HttpTypes } from '@medusajs/types'

interface ProductModuleProps {
  module: Extract<CollageModule, { type: 'product' }>
  products?: HttpTypes.StoreProduct[]
  region?: HttpTypes.StoreRegion
}

/**
 * 主推产品模块组件
 */
export function ProductModuleComponent({
  module,
  products,
  region,
}: ProductModuleProps) {
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
