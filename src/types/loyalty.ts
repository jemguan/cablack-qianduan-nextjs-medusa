/**
 * 积分账户信息
 */
export interface LoyaltyAccount {
  id: string
  points: number
  total_earned: number
  is_member: boolean
  membership_expires_at: string | null
}

/**
 * 积分系统配置
 */
export interface LoyaltyConfig {
  is_points_enabled: boolean
  points_earn_rate: number
  vip_multiplier: number
  coupon_redemption_rate: number
}

/**
 * 积分交易记录
 */
export interface LoyaltyTransaction {
  id: string
  account_id: string
  amount: number
  type: LoyaltyTransactionType
  reference_id: string | null
  metadata: Record<string, any> | null
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * 交易类型
 */
export type LoyaltyTransactionType =
  | "EARN_ORDER"      // 订单获得
  | "REDEEM_COUPON"   // 兑换优惠券
  | "REDEEM_ITEM"     // 兑换商品
  | "REFUND_DEDUCT"   // 退款扣回
  | "REFUND_CLAWBACK" // 退款扣回（旧类型）
  | "ADMIN_ADJUST"    // 人工调整
  | "ADMIN_DEDUCT"    // 人工扣除

/**
 * 兑换规则
 */
export interface RewardRule {
  id: string
  product_id: string | null
  variant_id: string
  product_title?: string
  product_thumbnail?: string
  variant_title?: string
  variant_sku?: string
  required_points: number
  is_active: boolean
  daily_limit: number | null
  stock_quantity?: number  // 库存数量
  in_stock?: boolean       // 是否有库存
  created_at: string
  updated_at: string
}

/**
 * 获取积分账户的响应
 */
export interface LoyaltyAccountResponse {
  account: LoyaltyAccount
  config: LoyaltyConfig
  recent_transactions: LoyaltyTransaction[]
}

/**
 * 获取交易记录的响应
 */
export interface LoyaltyTransactionsResponse {
  transactions: LoyaltyTransaction[]
  count: number
  offset: number
  limit: number
}

/**
 * 获取兑换规则的响应
 */
export interface RewardRulesResponse {
  rules: RewardRule[]
  count: number
  offset: number
  limit: number
}

/**
 * 兑换优惠券的请求
 */
export interface RedeemCouponRequest {
  points: number
}

/**
 * 兑换优惠券的响应
 */
export interface RedeemCouponResponse {
  success: boolean
  promotion_code: string
  discount_amount: number
  currency: string
  points_used: number
  remaining_points: number
}

/**
 * 兑换商品的请求
 */
export interface RedeemItemRequest {
  product_id: string
  quantity?: number
}

/**
 * 兑换商品的响应
 */
export interface RedeemItemResponse {
  success: boolean
  product_id: string
  variant_id: string
  quantity: number
  required_points: number
  remaining_points: number
  promotion_code: string  // 专属折扣码
  metadata: {
    is_reward: boolean
    point_cost: number
    promotion_code: string
  }
}

/**
 * 交易类型的标签
 */
export const TRANSACTION_TYPE_LABELS: Record<LoyaltyTransactionType, string> = {
  EARN_ORDER: "Order Earned",
  REDEEM_COUPON: "Coupon Redeemed",
  REDEEM_ITEM: "Product Redeemed",
  REFUND_DEDUCT: "Refund Deducted",
  REFUND_CLAWBACK: "Refund Clawback",
  ADMIN_ADJUST: "Admin Adjustment",
  ADMIN_DEDUCT: "Admin Deduction",
}
