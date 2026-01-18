"use client"

import Link from "next/link"
import type { LoyaltyConfig } from "@/types/loyalty"

interface ProductPointsLoginPromptProps {
  price: number // 商品价格（以货币单位为单位，如 129.99 CAD）
  currencyCode: string
  // 从父组件传入，避免重复 API 请求
  loyaltyConfig?: LoyaltyConfig | null
  isLoggedIn?: boolean
}

export default function ProductPointsLoginPrompt({ 
  price, 
  currencyCode,
  loyaltyConfig,
  isLoggedIn = false,
}: ProductPointsLoginPromptProps) {
  // 从 props 获取配置，使用默认值
  const isPointsEnabled = loyaltyConfig?.is_points_enabled ?? false
  const pointsEarnRate = loyaltyConfig?.points_earn_rate ?? 10

  // 如果积分系统未启用或用户已登录，不显示此组件
  // 已登录时应该显示 ProductPointsInfo 组件
  if (!isPointsEnabled || isLoggedIn) {
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
