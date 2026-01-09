"use client"

import { useState, useCallback, useEffect } from "react"
import { RewardRule, LoyaltyAccount, LoyaltyTransaction } from "@/types/loyalty"
import { redeemItem, refreshLoyaltyCache, getLoyaltyTransactions } from "@lib/data/loyalty"
import { addToCart, applyPromotions } from "@lib/data/cart"
import clsx from "clsx"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface RedeemProductsProps {
  rules: RewardRule[]
  account: LoyaltyAccount
  onSuccess?: () => void
}

interface RedeemedReward {
  code: string
  product_title: string
  product_thumbnail: string | null
  points_used: number
  created_at: string
}

export default function RedeemProducts({
  rules,
  account,
  onSuccess,
}: RedeemProductsProps) {
  const router = useRouter()
  const [selectedRule, setSelectedRule] = useState<RewardRule | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    code?: string
    showCartLink?: boolean
  } | null>(null)
  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>([])
  const [isLoadingRewards, setIsLoadingRewards] = useState(true)
  const [rewardPage, setRewardPage] = useState(1)
  const rewardPageSize = 6

  // 加载已兑换的商品折扣码
  useEffect(() => {
    const loadRedeemedRewards = async () => {
      try {
        const result = await getLoyaltyTransactions({ page: 1, limit: 100 })
        const rewardTransactions = result.transactions.filter(
          (tx: LoyaltyTransaction) => tx.type === "REDEEM_ITEM" && tx.metadata?.promotion_code
        )
        const rewards: RedeemedReward[] = rewardTransactions.map((tx: LoyaltyTransaction) => ({
          code: tx.metadata?.promotion_code || "",
          product_title: tx.metadata?.product_title || "Redeemed Product",
          product_thumbnail: tx.metadata?.product_thumbnail || null,
          points_used: Math.abs(tx.amount),
          created_at: tx.created_at,
        }))
        setRedeemedRewards(rewards)
      } catch (error) {
        console.error("Failed to load redeemed rewards:", error)
      } finally {
        setIsLoadingRewards(false)
      }
    }
    loadRedeemedRewards()
  }, [])

  // 复制折扣码到剪贴板
  const handleCopyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }, [])

  const handleRedeem = async (rule: RewardRule) => {
    if (account.points < rule.required_points) {
      setResult({
        success: false,
        message: "Insufficient points",
      })
      return
    }

    setSelectedRule(rule)
    setIsLoading(true)
    setResult(null)

    try {
      // 1. 兑换商品（创建专属折扣码并扣除积分）
      const response = await redeemItem(rule.variant_id, 1)
      if (response.success && response.promotion_code) {
        // 2. 将商品添加到购物车
        await addToCart({
          variantId: rule.variant_id,
          quantity: 1,
          metadata: response.metadata, // { is_reward: true, point_cost: xxx, promotion_code: xxx }
        })

        // 3. 自动应用专属折扣码
        try {
          await applyPromotions([response.promotion_code])
        } catch (promoError) {
          console.warn("Failed to apply reward promotion:", promoError)
          // 即使折扣码应用失败，也显示成功（用户可以手动应用）
        }

        // 4. 添加到已兑换列表
        setRedeemedRewards((prev) => [
          {
            code: response.promotion_code,
            product_title: rule.product_title || "Redeemed Product",
            product_thumbnail: rule.product_thumbnail || null,
            points_used: rule.required_points,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ])

        setResult({
          success: true,
          message: `🎉 Success! Product added to cart.`,
          code: response.promotion_code,
          showCartLink: true,
        })
        await refreshLoyaltyCache()
        onSuccess?.()
      }
    } catch (error: any) {
      // 翻译常见的错误信息
      let errorMessage = error.message || "Redemption failed, please try again"
      if (errorMessage.includes("inventory") || errorMessage.includes("Inventory")) {
        errorMessage = "Insufficient inventory, temporarily unavailable"
      } else if (errorMessage.includes("Insufficient points")) {
        errorMessage = "Insufficient points"
      } else if (errorMessage.includes("not available")) {
        errorMessage = "This product is not available for redemption"
      }
      
      setResult({
        success: false,
        message: errorMessage,
      })
    } finally {
      setIsLoading(false)
      setSelectedRule(null)
    }
  }

  const handleGoToCart = useCallback(() => {
    // 从当前路径获取 countryCode（例如 /ca/account/loyalty -> ca）
    const pathParts = window.location.pathname.split("/")
    const countryCode = pathParts[1] || "ca"
    router.push(`/${countryCode}/cart`)
  }, [router])

  if (rules.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mx-auto mb-4 opacity-50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <p>No products available for redemption</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Redeem Products</h3>
        <p className="text-sm text-muted-foreground">
          Use your points to redeem exclusive products
        </p>
      </div>

      {/* Result */}
      {result && (
        <div
          className={clsx(
            "rounded-lg p-4",
            result.success
              ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
          )}
        >
          {result.success ? (
            <div>
              <p className="text-green-700 dark:text-green-300 font-medium">
                {result.message}
              </p>
              {result.code && (
                <div className="mt-3 bg-white dark:bg-gray-900 rounded-lg p-3 border border-green-300 dark:border-green-700">
                  <p className="text-xs text-muted-foreground mb-1">Product discount code (auto-applied)</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-green-800 dark:text-green-200 select-all">
                      {result.code}
                    </span>
                    <button
                      onClick={() => handleCopyCode(result.code!)}
                      className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
              {result.showCartLink && (
                <button
                  onClick={handleGoToCart}
                  className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  🛒 Go to Cart
                </button>
              )}
            </div>
          ) : (
            <p className="text-red-700 dark:text-red-300">{result.message}</p>
          )}
        </div>
      )}

      {/* Product List */}
      <div className="grid gap-4 sm:grid-cols-2">
        {rules.map((rule) => {
          const canAfford = account.points >= rule.required_points
          const inStock = rule.in_stock !== false // 默认为 true（兼容旧数据）
          const canRedeem = canAfford && inStock
          const isSelected = selectedRule?.id === rule.id

          return (
            <div
              key={rule.id}
              className={clsx(
                "rounded-lg border p-4 transition-all relative",
                canRedeem
                  ? "border-border hover:border-primary/50 hover:shadow-sm"
                  : "border-border opacity-60"
              )}
            >
              {/* Out of Stock Label */}
              {!inStock && (
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 text-xs rounded-full font-medium">
                  Out of Stock
                </div>
              )}

              <div className="flex gap-4">
                {/* Product Image */}
                <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  {rule.product_thumbnail ? (
                    <Image
                      src={rule.product_thumbnail}
                      alt={rule.product_title || "Product"}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">
                    {rule.product_title || "Unknown Product"}
                  </h4>
                  {rule.variant_title && (
                    <p className="text-xs text-muted-foreground truncate">
                      {rule.variant_title}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-primary font-bold">
                      {rule.required_points.toLocaleString()} pts
                    </span>
                    {rule.daily_limit && (
                      <span className="text-xs text-muted-foreground">
                        Limit {rule.daily_limit}/day
                      </span>
                    )}
                    {inStock && typeof rule.stock_quantity === "number" && rule.stock_quantity > 0 && rule.stock_quantity <= 5 && (
                      <span className="text-xs text-orange-600 dark:text-orange-400">
                        Only {rule.stock_quantity} left
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Redeem Button */}
              <button
                onClick={() => handleRedeem(rule)}
                disabled={!canRedeem || isLoading}
                className={clsx(
                  "w-full mt-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  canRedeem && !isLoading
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {isSelected && isLoading
                  ? "Redeeming..."
                  : !inStock
                  ? "Out of Stock"
                  : canAfford
                  ? "Redeem Now"
                  : "Not Enough Points"}
              </button>
            </div>
          )
        })}
      </div>

      {/* Redeemed Products List */}
      <div className="mt-8 pt-6 border-t border-border">
        <h4 className="text-base font-medium mb-4 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          My Product Codes
        </h4>

        {isLoadingRewards ? (
          <div className="text-center py-6 text-muted-foreground">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading...
          </div>
        ) : redeemedRewards.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 mx-auto mb-2 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <p>No redeemed product codes yet</p>
            <p className="text-xs mt-1">Product codes you redeem will appear here</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {redeemedRewards
                .slice((rewardPage - 1) * rewardPageSize, rewardPage * rewardPageSize)
                .map((reward, index) => (
                <div
                  key={`${reward.code}-${index}`}
                  className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  {/* Product Image */}
                  <div className="w-14 h-14 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {reward.product_thumbnail ? (
                      <Image
                        src={reward.product_thumbnail}
                        alt={reward.product_title}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono font-bold text-base text-primary select-all">
                        {reward.code}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {reward.product_title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{reward.points_used.toLocaleString()} pts used</span>
                      <span>·</span>
                      <span>
                        {new Date(reward.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyCode(reward.code)}
                    className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors flex items-center gap-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy
                  </button>
                </div>
              ))}
            </div>
            {/* Pagination */}
            {redeemedRewards.length > rewardPageSize && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setRewardPage((p) => Math.max(1, p - 1))}
                  disabled={rewardPage === 1}
                  className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  {rewardPage} / {Math.ceil(redeemedRewards.length / rewardPageSize)}
                </span>
                <button
                  onClick={() => setRewardPage((p) => Math.min(Math.ceil(redeemedRewards.length / rewardPageSize), p + 1))}
                  disabled={rewardPage >= Math.ceil(redeemedRewards.length / rewardPageSize)}
                  className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
