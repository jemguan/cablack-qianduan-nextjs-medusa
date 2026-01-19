"use client"

import { useState, useEffect, useCallback } from "react"
import { LoyaltyTransaction } from "@/types/loyalty"
import { getLoyaltyTransactions } from "@lib/data/loyalty"
import type { RedeemedReward } from "../types"

/**
 * 加载已兑换的商品折扣码
 */
export function useRedeemedRewards() {
  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>([])
  const [isLoadingRewards, setIsLoadingRewards] = useState(true)

  useEffect(() => {
    const loadRedeemedRewards = async () => {
      try {
        const result = await getLoyaltyTransactions({ page: 1, limit: 100 })
        const rewardTransactions = result.transactions.filter(
          (tx: LoyaltyTransaction) =>
            tx.type === "REDEEM_ITEM" && tx.metadata?.promotion_code
        )
        const rewards: RedeemedReward[] = rewardTransactions.map(
          (tx: LoyaltyTransaction) => ({
            code: tx.metadata?.promotion_code || "",
            product_title: tx.metadata?.product_title || "Redeemed Product",
            product_thumbnail: tx.metadata?.product_thumbnail || null,
            points_used: Math.abs(tx.amount),
            created_at: tx.created_at,
          })
        )
        setRedeemedRewards(rewards)
      } catch (error) {
        console.error("Failed to load redeemed rewards:", error)
      } finally {
        setIsLoadingRewards(false)
      }
    }
    loadRedeemedRewards()
  }, [])

  const addRedeemedReward = useCallback((reward: RedeemedReward) => {
    setRedeemedRewards((prev) => [reward, ...prev])
  }, [])

  return {
    redeemedRewards,
    isLoadingRewards,
    addRedeemedReward,
  }
}
