import { Bell, AlertCircle } from "lucide-react"
import type { RestockItem, SubscriptionStatus, ProductPrice } from "./types"

/**
 * 格式化日期字符串
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ""
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return ""
  }
}

/**
 * 获取订阅状态信息
 */
export function getSubscriptionStatus(item: RestockItem): SubscriptionStatus {
  if (item.status === "purchased") {
    return {
      label: "Purchased",
      color: "text-green-700 bg-green-50",
      icon: AlertCircle({ size: 14 }),
    }
  }

  if (item.last_restocked_at) {
    const restockDate = formatDate(item.last_restocked_at)
    return {
      label: `Restocked on ${restockDate}`,
      color: "text-blue-700 bg-blue-50",
      icon: Bell({ size: 14 }),
    }
  }

  return {
    label: "Waiting for Restock",
    color: "text-amber-700 bg-amber-50",
    icon: AlertCircle({ size: 14 }),
  }
}

/**
 * 获取产品价格信息
 */
export function getProductPrice(product: any): ProductPrice | null {
  if (!product?.variants?.[0]?.calculated_price) return null
  const price = product.variants[0].calculated_price
  return {
    amount: price.calculated_amount,
    currency_code: price.calculated_currency_code || price.currency_code,
    original_amount: price.original_amount,
    is_on_sale: price.calculated_amount < price.original_amount,
  }
}

/**
 * 按状态分组订阅
 */
export function groupSubscriptionsByStatus(subscriptions: RestockItem[]) {
  return {
    active: subscriptions.filter((s) => s.status === "active"),
    purchased: subscriptions.filter((s) => s.status === "purchased"),
  }
}
