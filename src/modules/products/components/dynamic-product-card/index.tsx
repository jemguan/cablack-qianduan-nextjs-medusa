"use client"

import { HttpTypes } from "@medusajs/types"
import { useProductCardConfig } from "@lib/context/product-card-config-context"
import ProductPreview from "../product-preview"
import ProductCardV2 from "../product-card2"
import ProductCard3 from "../product-card3"
import type { Brand } from "@lib/data/brands"
import type { LoyaltyAccount } from "@/types/loyalty"

// 预获取的评价统计类型
interface PreFetchedReviewStats {
  average_rating: number
  total: number
}

export interface DynamicProductCardProps {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  isFeatured?: boolean
  priority?: boolean
  customer?: HttpTypes.StoreCustomer | null
  loyaltyAccount?: LoyaltyAccount | null
  membershipProductIds?: Record<string, boolean> | null
  // Card3 专用
  brand?: Brand | null
  reviewStats?: PreFetchedReviewStats | null
}

/**
 * 动态产品卡片组件
 * 根据全局配置的 cardType 自动选择使用哪种卡片样式
 */
export function DynamicProductCard({
  product,
  region,
  isFeatured,
  priority,
  customer,
  loyaltyAccount,
  membershipProductIds,
  brand,
  reviewStats,
}: DynamicProductCardProps) {
  const config = useProductCardConfig()
  const cardType = config.cardType

  switch (cardType) {
    case 'card2':
      return (
        <ProductCardV2
          product={product}
          region={region}
          isFeatured={isFeatured}
          priority={priority}
          customer={customer}
          loyaltyAccount={loyaltyAccount}
          membershipProductIds={membershipProductIds}
        />
      )
    case 'card3':
      return (
        <ProductCard3
          product={product}
          region={region}
          brand={brand}
          reviewStats={reviewStats}
          priority={priority}
          customer={customer}
        />
      )
    default:
      return (
        <ProductPreview
          product={product}
          region={region}
          isFeatured={isFeatured}
          priority={priority}
          customer={customer}
          loyaltyAccount={loyaltyAccount}
          membershipProductIds={membershipProductIds}
        />
      )
  }
}

export default DynamicProductCard
