/**
 * Affiliate 模块工具函数
 */

import type { Product } from "./types"

/**
 * 格式化货币金额（从分转换为美元）
 */
export function formatCurrency(amount: number): string {
  return `$${(Number(amount) / 100).toFixed(2)}`
}

/**
 * 生成产品推广链接
 */
export function generateProductLink(
  product: Product,
  affiliateLink: string
): string {
  const affiliateLinkUrl = new URL(affiliateLink)
  const baseUrl = affiliateLinkUrl.origin

  // 构建产品推广链接，复制原有的 affiliate 参数
  const params = new URLSearchParams()
  affiliateLinkUrl.searchParams.forEach((value, key) => {
    params.set(key, value)
  })

  return `${baseUrl}/products/${product.handle}?${params.toString()}`
}

/**
 * 获取订单号显示文本
 */
export function getOrderNumber(
  orderId: string | null,
  orderDisplayId: number | null
): string {
  if (orderDisplayId) {
    return `#${orderDisplayId}`
  }
  if (orderId) {
    return `#${orderId}`
  }
  return "Unknown Order"
}

/**
 * 格式化日期时间
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US")
}

/**
 * 格式化日期时间（详细格式）
 */
export function formatDateTimeDetailed(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}
