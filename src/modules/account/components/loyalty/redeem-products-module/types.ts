import { RewardRule, LoyaltyAccount } from "@/types/loyalty"

export interface RedeemProductsProps {
  rules: RewardRule[]
  account: LoyaltyAccount
  onSuccess?: () => void
}

export interface RedeemedReward {
  code: string
  product_title: string
  product_thumbnail: string | null
  points_used: number
  created_at: string
}

export interface RedemptionResult {
  success: boolean
  message: string
  code?: string
  showCartLink?: boolean
}

export interface ProductCardProps {
  rule: RewardRule
  canAfford: boolean
  inStock: boolean
  isSelected: boolean
  isLoading: boolean
  productHandle?: string
  onRedeem: (rule: RewardRule) => void
}

export interface RedeemedRewardCardProps {
  reward: RedeemedReward
  onCopyCode: (code: string) => void
}

export interface ResultMessageProps {
  result: RedemptionResult
  onCopyCode: (code: string) => void
  onGoToCart: () => void
}

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}
