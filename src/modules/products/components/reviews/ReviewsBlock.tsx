import type { ReviewsBlockProps } from "./types"
import { Reviews } from "./index"
import { DEFAULT_REVIEWS_CONFIG } from "./config"

/**
 * Reviews Block 包装组件
 * 用于在产品页面布局中作为一个 block 使用
 */
export function ReviewsBlock({ product, region, config }: ReviewsBlockProps) {
  return (
    <section className="w-full">
      <Reviews product={product} region={region} config={config ?? DEFAULT_REVIEWS_CONFIG} />
    </section>
  )
}

export default ReviewsBlock

