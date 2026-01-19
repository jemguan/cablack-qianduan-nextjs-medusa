"use client"

import { useState, useEffect } from "react"
import type { PaymentHistoryData } from "../types"

/**
 * 获取支付历史数据的 Hook
 */
export function usePaymentHistory(hasAffiliate: boolean) {
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/affiliate/payment-history", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setPaymentHistory(data)
        }
      } catch (error) {
        console.error("Error fetching payment history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (hasAffiliate) {
      fetchPaymentHistory()
    }
  }, [hasAffiliate])

  return { paymentHistory, isLoading }
}
