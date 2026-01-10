"use client"

import { useState, useEffect } from "react"
import { getLoyaltyAccount } from "@lib/data/loyalty"

interface ProductPointsInfoProps {
  price: number // 商品价格（以货币单位为单位，如 129.99 CAD）
  currencyCode: string
}

export default function ProductPointsInfo({ price, currencyCode }: ProductPointsInfoProps) {
  const [pointsEarnRate, setPointsEarnRate] = useState(10) // 默认 10 积分/$1
  const [vipMultiplier, setVipMultiplier] = useState(1)
  const [isMember, setIsMember] = useState(false)
  const [isPointsEnabled, setIsPointsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const fetchLoyaltyInfo = async () => {
      try {
        const data = await getLoyaltyAccount()
        if (data) {
          setIsPointsEnabled(data.config.is_points_enabled || false)
          setPointsEarnRate(data.config.points_earn_rate || 10)
          setVipMultiplier(data.config.vip_multiplier || 1)
          // 检查用户是否登录（有 account 信息表示已登录）
          setIsLoggedIn(!!data.account)
          // 只有在用户登录且有账户信息时才设置会员状态
          setIsMember(data.account?.is_member || false)
        } else {
          // 如果返回 null，说明用户未登录
          setIsLoggedIn(false)
        }
      } catch (error) {
        // 忽略错误，使用默认值
        setIsLoggedIn(false)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLoyaltyInfo()
  }, [])

  // 如果正在加载、积分系统未启用或用户未登录，不显示此组件
  // 未登录时应该显示 ProductPointsLoginPrompt 组件
  if (isLoading || !isPointsEnabled || !isLoggedIn) {
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
