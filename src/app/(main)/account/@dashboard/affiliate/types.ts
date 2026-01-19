/**
 * Affiliate 模块类型定义
 */

export type Product = {
  id: string
  title: string
  handle: string
  thumbnail: string | null
}

export type AffiliateStats = {
  total_orders: number
  pending_amount: number
  approved_amount: number
  paid_amount: number
  void_amount: number
  total_earnings?: number
}

export type Affiliate = {
  id: string
  code: string
  commission_rate: number
  is_active: boolean
  affiliate_link: string
  discount_code: string
  stats: AffiliateStats
}

export type AffiliateData = {
  affiliate: Affiliate
}

export type Commission = {
  id: string
  order_id: string
  order_display_id: number | null
  amount: number
  status: "PENDING" | "APPROVED" | "PAID" | "VOID"
  created_at: string
  void_reason: string | null
}

export type StatsData = {
  stats: AffiliateStats
  recent_commissions: Commission[]
}

export type PaymentRecord = {
  paid_at: string
  amount: number
  commission_count: number
  order_ids: string[]
  order_display_ids?: number[]
  payment_note: string | null
}

export type PaymentHistoryData = {
  payment_records: PaymentRecord[]
  total_paid: number
  total_commissions: number
}
