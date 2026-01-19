/**
 * ProductContent Block Handler
 * 产品页的核心内容区域，包含产品图片、信息、操作等
 */

import type { HttpTypes } from "@medusajs/types"
import type { BlockBase, BlockConfig } from "./types"
import type { LoyaltyAccount } from "@/types/loyalty"
import type { OptionTemplate } from "@lib/data/option-templates"

export function handleProductContentBlock(
  block: BlockBase,
  blockConfig: Record<string, any>,
  product: HttpTypes.StoreProduct,
  region: HttpTypes.StoreRegion,
  images: HttpTypes.StoreProductImage[],
  initialVariantId?: string,
  htmlDescription?: string | null,
  customer?: HttpTypes.StoreCustomer | null,
  loyaltyAccount?: LoyaltyAccount | null,
  membershipProductIds?: Record<string, boolean> | null,
  optionTemplates?: OptionTemplate[]
): BlockConfig | null {
  // 确定布局类型，默认为 two-column
  const layout = blockConfig.layout || "two-column"
  const isEnabled = blockConfig.enabled !== false

  // 如果禁用，返回 null
  if (!isEnabled) {
    return null
  }

  return {
    id: `product-content-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: "ProductContent",
    props: {
      product,
      region,
      images,
      initialVariantId,
      layout,
      shippingReturnsConfig: blockConfig.shippingReturnsConfig,
      htmlDescription,
      customer,
      loyaltyAccount,
      membershipProductIds,
      optionTemplates: optionTemplates || [],
    },
  }
}
