export interface RestockItem {
  id: string
  product_id: string
  variant_id: string
  product_title?: string
  variant_title?: string
  status: "active" | "purchased"
  last_restocked_at?: string | null
  last_notified_at?: string | null
  notification_count: number
  created_at: string
}

export interface SubscriptionStatus {
  label: string
  color: string
  icon: React.ReactNode
}

export interface ProductPrice {
  amount: number
  currency_code: string
  original_amount?: number
  is_on_sale: boolean
}

export interface SubscriptionCardProps {
  subscription: RestockItem
  product: any
  statusInfo: SubscriptionStatus
  isUnsubscribing: boolean
  isAddingToCart: boolean
  onUnsubscribe: (id: string) => void
  onAddToCart: (subscription: RestockItem, product: any) => void
}

export interface PurchasedCardProps {
  subscription: RestockItem
  product: any
  statusInfo: SubscriptionStatus
  isUnsubscribing: boolean
  onUnsubscribe: (id: string) => void
}
