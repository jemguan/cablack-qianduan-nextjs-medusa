import { HttpTypes } from "@medusajs/types"

/**
 * 将变体选项转换为键值映射
 */
export const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
): Record<string, string> => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {}) || {}
}

/**
 * 检查变体是否有库存
 */
export const checkInStock = (variant: HttpTypes.StoreProductVariant | undefined): boolean => {
  // If we don't manage inventory, we can always add to cart
  if (variant && !variant.manage_inventory) {
    return true
  }

  // If we allow back orders on the variant, we can add to cart
  if (variant?.allow_backorder) {
    return true
  }

  // If there is inventory available, we can add to cart
  if (
    variant?.manage_inventory &&
    (variant?.inventory_quantity || 0) > 0
  ) {
    return true
  }

  // Otherwise, we can't add to cart
  return false
}

/**
 * 计算最大可选数量
 */
export const calculateMaxQuantity = (variant: HttpTypes.StoreProductVariant | undefined): number => {
  if (!variant) return 99
  if (!variant.manage_inventory) return 99
  if (variant.allow_backorder) return 99
  return Math.min(variant.inventory_quantity || 99, 99)
}

/**
 * 检查用户是否是 VIP
 */
export const checkIsVip = (loyaltyAccount: { is_member?: boolean; membership_expires_at?: string | null } | null | undefined): boolean => {
  if (!loyaltyAccount) return false
  if (!loyaltyAccount.is_member) return false
  if (!loyaltyAccount.membership_expires_at) return false
  return new Date(loyaltyAccount.membership_expires_at) > new Date()
}
