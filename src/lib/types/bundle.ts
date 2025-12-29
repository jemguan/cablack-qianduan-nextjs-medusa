/**
 * Bundle 相关类型定义
 */

export interface BundleProduct {
  id: string
  product_id: string
  product?: {
    id: string
    title: string
    handle: string
    thumbnail?: string | null
    images?: Array<{ url: string }>
    variants?: Array<{
      id: string
      title: string
      prices?: Array<{
        amount: number
        currency_code: string
      }>
    }>
  }
  quantity: number
  is_main: boolean
}

export interface Bundle {
  id: string
  title: string
  description?: string | null
  slug?: string | null
  discount_type: "percentage" | "fixed_amount" | "fixed_price"
  discount_value: number
  is_active: boolean
  thumbnail_url?: string | null
  promotion_code?: string | null
  promotion_id?: string | null
  items?: BundleProduct[]
  main_products?: BundleProduct[]
  addon_products?: BundleProduct[]
  created_at: string
  updated_at: string
}

export interface BundlesByProductResponse {
  bundles: Bundle[]
  message?: string
}

