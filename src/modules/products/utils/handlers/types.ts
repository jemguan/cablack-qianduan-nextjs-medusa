/**
 * 产品页 Block Handler 共享类型定义
 */

import type { HttpTypes } from "@medusajs/types"
import type { LoyaltyAccount } from "@/types/loyalty"
import type { OptionTemplate } from "@lib/data/option-templates"

/**
 * Block 基础配置
 */
export interface BlockBase {
  id: string
  type: string
  enabled: boolean
  order: number
  config: Record<string, any>
}

/**
 * Block 配置结果
 */
export interface BlockConfig {
  id: string
  type: string
  enabled: boolean
  order: number
  config: Record<string, any>
  componentName: string
  props: Record<string, any>
}

/**
 * ProductContent Block Props
 */
export interface ProductContentProps {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  images: HttpTypes.StoreProductImage[]
  initialVariantId?: string
  layout: string
  shippingReturnsConfig?: Record<string, any>
  htmlDescription?: string | null
  customer?: HttpTypes.StoreCustomer | null
  loyaltyAccount?: LoyaltyAccount | null
  membershipProductIds?: Record<string, boolean> | null
  optionTemplates: OptionTemplate[]
}
