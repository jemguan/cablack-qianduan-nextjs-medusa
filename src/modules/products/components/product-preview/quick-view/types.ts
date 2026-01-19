/**
 * QuickView 相关类型定义
 */

import type { HttpTypes } from "@medusajs/types"
import type { LoyaltyAccount } from "@/types/loyalty"

export interface QuickViewModalProps {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  isOpen: boolean
  onClose: () => void
  /** 当前登录的客户 */
  customer?: HttpTypes.StoreCustomer | null
  /** 积分账户信息 */
  loyaltyAccount?: LoyaltyAccount | null
  /** 会员产品 ID 列表 */
  membershipProductIds?: Record<string, boolean> | null
}

export interface AddToCartButtonProps {
  selectedVariant: HttpTypes.StoreProductVariant | null | undefined
  isValidVariant: boolean
  inStock: boolean
  isAdding: boolean
  isMembershipProduct: boolean
  isLoggedIn: boolean
  isVip: boolean
  isSubscribed: boolean
  isTogglingNotify: boolean
  isNotifyLoading: boolean
  onAddToCart: () => void
  onNotifyMe: () => void
  onLoginRequired: () => void
}
