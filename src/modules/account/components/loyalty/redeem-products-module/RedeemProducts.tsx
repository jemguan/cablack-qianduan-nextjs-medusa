"use client"

import { useState } from "react"
import { FaBox } from "react-icons/fa"

import { useProductHandles, useRedeemedRewards, useRedemption } from "./hooks"
import {
  ProductCard,
  RedeemedRewardCard,
  ResultMessage,
  Pagination,
  EmptyState,
  LoadingSpinner,
} from "./components"
import type { RedeemProductsProps } from "./types"

const REWARD_PAGE_SIZE = 6

export default function RedeemProducts({
  rules,
  account,
  onSuccess,
}: RedeemProductsProps) {
  const [rewardPage, setRewardPage] = useState(1)

  // Hooks
  const productHandles = useProductHandles(rules)
  const { redeemedRewards, isLoadingRewards, addRedeemedReward } =
    useRedeemedRewards()
  const {
    selectedRule,
    isLoading,
    result,
    handleRedeem,
    handleCopyCode,
    handleGoToCart,
  } = useRedemption({
    account,
    onSuccess,
    onRewardAdded: addRedeemedReward,
  })

  // 空状态
  if (rules.length === 0) {
    return <EmptyState type="products" />
  }

  // 分页计算
  const totalPages = Math.ceil(redeemedRewards.length / REWARD_PAGE_SIZE)
  const paginatedRewards = redeemedRewards.slice(
    (rewardPage - 1) * REWARD_PAGE_SIZE,
    rewardPage * REWARD_PAGE_SIZE
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium mb-2">Redeem Products</h3>
        <p className="text-sm text-muted-foreground">
          Use your points to redeem exclusive products
        </p>
      </div>

      {/* Result Message */}
      {result && (
        <ResultMessage
          result={result}
          onCopyCode={handleCopyCode}
          onGoToCart={handleGoToCart}
        />
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 small:gap-4">
        {rules.map((rule) => {
          const canAfford = account.points >= rule.required_points
          const inStock = rule.in_stock !== false

          return (
            <ProductCard
              key={rule.id}
              rule={rule}
              canAfford={canAfford}
              inStock={inStock}
              isSelected={selectedRule?.id === rule.id}
              isLoading={isLoading}
              productHandle={
                rule.product_id ? productHandles[rule.product_id] : undefined
              }
              onRedeem={handleRedeem}
            />
          )
        })}
      </div>

      {/* Redeemed Products Section */}
      <div className="mt-6 small:mt-8 pt-4 small:pt-6 border-t border-border">
        <h4 className="text-base font-medium mb-3 small:mb-4 flex items-center gap-2">
          <FaBox className="h-5 w-5 text-primary" />
          My Product Codes
        </h4>

        {isLoadingRewards ? (
          <LoadingSpinner />
        ) : redeemedRewards.length === 0 ? (
          <EmptyState type="rewards" />
        ) : (
          <>
            <div className="space-y-3">
              {paginatedRewards.map((reward, index) => (
                <RedeemedRewardCard
                  key={`${reward.code}-${index}`}
                  reward={reward}
                  onCopyCode={handleCopyCode}
                />
              ))}
            </div>
            <Pagination
              currentPage={rewardPage}
              totalPages={totalPages}
              onPageChange={setRewardPage}
            />
          </>
        )}
      </div>
    </div>
  )
}
