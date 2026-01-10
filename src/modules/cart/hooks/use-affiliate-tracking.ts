"use client"

import { useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import { getAffiliateCode, initAffiliateTracking } from "@lib/affiliate-tracking"
import { updateCart } from "@lib/data/cart"

/**
 * Hook to sync Affiliate Code to Cart metadata
 * 在购物车创建或更新时，将 Affiliate Code 同步到 Cart metadata
 */
export function useAffiliateTracking(cart: HttpTypes.StoreCart | null) {
  useEffect(() => {
    // 初始化追踪（检测 URL 参数）
    initAffiliateTracking()

    // 如果购物车存在，同步 Affiliate Code
    if (cart?.id) {
      const affiliateCode = getAffiliateCode()

      if (affiliateCode) {
        // 检查购物车 metadata 中是否已有 affiliate_code
        const existingCode = cart.metadata?.affiliate_code

        // Last Click Wins: 如果 metadata 中没有或不同，则更新（使用时间戳）
        if (!existingCode || existingCode !== affiliateCode) {
          updateCart({
            metadata: {
              ...cart.metadata,
              affiliate_code: affiliateCode,
              affiliate_code_timestamp: Date.now().toString(),
            },
          }).catch((error) => {
            console.error("[Affiliate Tracking] Error updating cart metadata:", error)
          })
        }
      }
    }
  }, [cart?.id, cart?.metadata])
}
