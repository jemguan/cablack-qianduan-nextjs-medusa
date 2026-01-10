"use client"

import { useState, useEffect } from "react"
import { getLoyaltyAccount, getLoyaltyConfig } from "@lib/data/loyalty"
import Link from "next/link"

interface ProductPointsLoginPromptProps {
  price: number // 商品价格（以货币单位为单位，如 129.99 CAD）
  currencyCode: string
}

export default function ProductPointsLoginPrompt({ 
  price, 
  currencyCode 
}: ProductPointsLoginPromptProps) {
  const [pointsEarnRate, setPointsEarnRate] = useState(10) // 默认 10 积分/$1
  const [isPointsEnabled, setIsPointsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const fetchLoyaltyInfo = async () => {
      try {
        // 先检查用户是否登录
        try {
          const accountData = await getLoyaltyAccount()
          const isLoggedIn = !!accountData?.account
          setIsLoggedIn(isLoggedIn)

          // 如果用户已登录，不显示此组件
          if (isLoggedIn) {
            setIsLoading(false)
            return
          }
        } catch (accountError) {
          // 如果获取账户信息失败（可能是未登录），继续获取配置
          setIsLoggedIn(false)
        }

        // 如果用户未登录，获取公开的配置信息
        try {
          const configData = await getLoyaltyConfig()
          if (configData) {
            setIsPointsEnabled(configData.config.is_points_enabled || false)
            setPointsEarnRate(configData.config.points_earn_rate || 10)
          }
        } catch (configError) {
          // 如果获取配置失败，使用默认值（不启用积分系统）
          setIsPointsEnabled(false)
        }
      } catch (error) {
        // 忽略所有错误，使用默认值
        setIsLoggedIn(false)
        setIsPointsEnabled(false)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLoyaltyInfo()
  }, [])

  // 如果正在加载、积分系统未启用或用户已登录，不显示此组件
  // 已登录时应该显示 ProductPointsInfo 组件
  if (isLoading || !isPointsEnabled || isLoggedIn) {
    return null
  }

  // 计算基础积分
  const basePoints = Math.floor(price * pointsEarnRate)

  if (basePoints <= 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 text-sm text-ui-fg-subtle bg-ui-bg-subtle-hover rounded-lg p-3 border border-ui-border-base">
      <div className="flex items-center gap-1.5 flex-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v12" />
          <path d="M8 10h8" />
          <path d="M8 14h8" />
        </svg>
        <span>
          Login and purchase to earn <span className="font-medium text-primary">{basePoints.toLocaleString()}</span> points
        </span>
      </div>
      <Link
        href="/account"
        className="text-primary hover:text-primary-hover font-medium text-sm underline"
      >
        Login
      </Link>
    </div>
  )
}
