"use client"

import { useState, useEffect } from "react"

/**
 * 获取自动审核配置的 Hook
 */
export function useAutoApproveConfig() {
  const [autoApproveDays, setAutoApproveDays] = useState<number>(0)

  useEffect(() => {
    const fetchAutoApproveConfig = async () => {
      try {
        const response = await fetch("/api/affiliate/auto-approve-config", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          const days = data.auto_approve_days || 0
          setAutoApproveDays(days)
        } else {
          const errorText = await response.text()
          console.error("[Affiliate] Failed to fetch auto approve config:", response.status, errorText)
        }
      } catch (error) {
        console.error("[Affiliate] Error fetching auto approve config:", error)
      }
    }

    fetchAutoApproveConfig()
  }, [])

  return autoApproveDays
}
