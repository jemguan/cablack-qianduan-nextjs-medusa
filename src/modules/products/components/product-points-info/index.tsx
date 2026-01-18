"use client"

import type { LoyaltyAccount, LoyaltyConfig } from "@/types/loyalty"

interface ProductPointsInfoProps {
  price: number // 商品价格（以货币单位为单位，如 129.99 CAD）
  currencyCode: string
  // 从父组件传入，避免重复 API 请求
  loyaltyAccount?: LoyaltyAccount | null
  loyaltyConfig?: LoyaltyConfig | null
  isLoggedIn?: boolean
}

export default function ProductPointsInfo({
  price,
  currencyCode,
  loyaltyAccount,
  loyaltyConfig,
  isLoggedIn = false,
}: ProductPointsInfoProps) {
  // 从 props 获取配置，使用默认值
  const isPointsEnabled = loyaltyConfig?.is_points_enabled ?? false
  const pointsEarnRate = loyaltyConfig?.points_earn_rate ?? 10
  const vipMultiplier = loyaltyConfig?.vip_multiplier ?? 1
  const isMember = loyaltyAccount?.is_member ?? false

  // 如果积分系统未启用或用户未登录，不显示此组件
  // 未登录时应该显示 ProductPointsLoginPrompt 组件
  if (!isPointsEnabled || !isLoggedIn) {
    return null
  }

  // Medusa 的 calculated_amount 已经是以货币单位（如美元/加元）为单位
  // 计算基础积分
  const basePoints = Math.floor(price * pointsEarnRate)
  
  // 计算 VIP 额外积分
  const vipPoints = isMember ? Math.floor(basePoints * (vipMultiplier - 1)) : 0
  const totalPoints = basePoints + vipPoints

  if (basePoints <= 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-1.5 text-primary">
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
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v12" />
          <path d="M8 10h8" />
          <path d="M8 14h8" />
        </svg>
        <span className="font-medium">
          Earn {totalPoints.toLocaleString()} points
        </span>
      </div>
      {isMember && vipPoints > 0 && (
        <span className="text-xs px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-medium">
          VIP Bonus +{vipPoints.toLocaleString()}
        </span>
      )}
    </div>
  )
}
