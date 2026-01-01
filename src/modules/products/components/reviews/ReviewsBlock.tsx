import type { HttpTypes } from "@medusajs/types"
import type { ReviewsBlockProps } from "./types"
import { Reviews } from "./index"

/**
 * Reviews Block 包装组件
 * 用于在产品页面布局中作为一个 block 使用
 */
export function ReviewsBlock({ product, region, config }: ReviewsBlockProps) {
  return (
    <section className="w-full">
      <Reviews product={product} region={region} config={config} />
    </section>
  )
}

export default ReviewsBlock

