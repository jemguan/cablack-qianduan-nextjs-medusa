"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { RewardRule, LoyaltyAccount } from "@/types/loyalty"
import { redeemItem, refreshLoyaltyCache } from "@lib/data/loyalty"
import { addToCart, applyPromotions } from "@lib/data/cart"
import type { RedemptionResult, RedeemedReward } from "../types"

interface UseRedemptionOptions {
  account: LoyaltyAccount
  onSuccess?: () => void
  onRewardAdded?: (reward: RedeemedReward) => void
}

/**
 * 处理商品兑换逻辑
 */
export function useRedemption({
  account,
  onSuccess,
  onRewardAdded,
}: UseRedemptionOptions) {
  const router = useRouter()
  const [selectedRule, setSelectedRule] = useState<RewardRule | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<RedemptionResult | null>(null)

  const handleRedeem = useCallback(
    async (rule: RewardRule) => {
      if (account.points < rule.required_points) {
        setResult({
          success: false,
          message: "Insufficient points",
        })
        return
      }

      setSelectedRule(rule)
      setIsLoading(true)
      setResult(null)

      try {
        // 1. 兑换商品（创建专属折扣码并扣除积分）
        const response = await redeemItem(rule.variant_id, 1)
        if (response.success && response.promotion_code) {
          // 2. 将商品添加到购物车
          await addToCart({
            variantId: rule.variant_id,
            quantity: 1,
            metadata: response.metadata,
          })

          // 3. 自动应用专属折扣码
          try {
            await applyPromotions([response.promotion_code])
          } catch (promoError) {
            console.warn("Failed to apply reward promotion:", promoError)
          }

          // 4. 添加到已兑换列表
          onRewardAdded?.({
            code: response.promotion_code,
            product_title: rule.product_title || "Redeemed Product",
            product_thumbnail: rule.product_thumbnail || null,
            points_used: rule.required_points,
            created_at: new Date().toISOString(),
          })

          setResult({
            success: true,
            message: `🎉 Success! Product added to cart.`,
            code: response.promotion_code,
            showCartLink: true,
          })
          await refreshLoyaltyCache()
          onSuccess?.()
        }
      } catch (error: any) {
        let errorMessage =
          error.message || "Redemption failed, please try again"
        if (
          errorMessage.includes("inventory") ||
          errorMessage.includes("Inventory")
        ) {
          errorMessage = "Insufficient inventory, temporarily unavailable"
        } else if (errorMessage.includes("Insufficient points")) {
          errorMessage = "Insufficient points"
        } else if (errorMessage.includes("not available")) {
          errorMessage = "This product is not available for redemption"
        }

        setResult({
          success: false,
          message: errorMessage,
        })
      } finally {
        setIsLoading(false)
        setSelectedRule(null)
      }
    },
    [account.points, onSuccess, onRewardAdded]
  )

  const handleCopyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }, [])

  const handleGoToCart = useCallback(() => {
    const pathParts = window.location.pathname.split("/")
    const countryCode = pathParts[1] || "ca"
    router.push(`/${countryCode}/cart`)
  }, [router])

  return {
    selectedRule,
    isLoading,
    result,
    handleRedeem,
    handleCopyCode,
    handleGoToCart,
  }
}
