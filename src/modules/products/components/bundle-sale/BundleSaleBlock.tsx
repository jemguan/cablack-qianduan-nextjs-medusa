import type { HttpTypes } from "@medusajs/types"
import type { BundleSaleData } from "./types"
import { BundleSale } from "./index"

export interface BundleSaleBlockProps {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  config?: BundleSaleData
}

/**
 * Bundle Sale Block 包装组件
 * 用于在产品页面布局中作为一个 block 使用
 */
export function BundleSaleBlock({ product, region, config }: BundleSaleBlockProps) {
  return (
    <section className="w-full">
      <BundleSale product={product} region={region} config={config} />
    </section>
  )
}

export default BundleSaleBlock

