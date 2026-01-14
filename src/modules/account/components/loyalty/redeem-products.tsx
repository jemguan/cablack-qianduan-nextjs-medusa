"use client"

import { useState, useCallback, useEffect } from "react"
import { RewardRule, LoyaltyAccount, LoyaltyTransaction } from "@/types/loyalty"
import { redeemItem, refreshLoyaltyCache, getLoyaltyTransactions } from "@lib/data/loyalty"
import { addToCart, applyPromotions } from "@lib/data/cart"
import clsx from "clsx"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { FaCopy, FaBox } from "react-icons/fa"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { listProducts } from "@lib/data/products"

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
  const [productHandles, setProductHandles] = useState<Record<string, string>>({})

  // 加载产品 handles
  useEffect(() => {
    const loadProductHandles = async () => {
      const productIds = rules
        .map((rule) => rule.product_id)
        .filter((id): id is string => id !== null)
      
      if (productIds.length === 0) return

      try {
        const { response } = await listProducts({
          queryParams: {
            id: productIds,
            limit: productIds.length,
            fields: "+handle",
          },
        })

        const handles: Record<string, string> = {}
        response.products?.forEach((product) => {
          if (product.id && product.handle) {
            handles[product.id] = product.handle
          }
        })
        setProductHandles(handles)
      } catch (error) {
        console.error("Failed to load product handles:", error)
      }
    }
    loadProductHandles()
  }, [rules])

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 small:gap-4">
        {rules.map((rule) => {
          const canAfford = account.points >= rule.required_points
          const inStock = rule.in_stock !== false // 默认为 true（兼容旧数据）
          const canRedeem = canAfford && inStock
          const isSelected = selectedRule?.id === rule.id

          return (
            <div
              key={rule.id}
              className={clsx(
                "rounded-lg border p-3 small:p-4 transition-all relative bg-card",
                canRedeem
                  ? "border-border/50 hover:border-primary/50 hover:shadow-sm"
                  : "border-border/50 opacity-60"
              )}
            >
              {/* Mobile: Horizontal Layout with image on left, Desktop: Horizontal Layout */}
              <div className="flex flex-row gap-3 small:gap-4">
                {/* Product Image - Clickable link to product page */}
                {rule.product_id && productHandles[rule.product_id] ? (
                  <LocalizedClientLink
                    href={`/products/${productHandles[rule.product_id]}`}
                    className="w-24 small:w-20 h-24 small:h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                    aria-label={`View ${rule.product_title || "product"} details`}
                  >
                    {rule.product_thumbnail ? (
                      <Image
                        src={rule.product_thumbnail}
                        alt={rule.product_title || "Product"}
                        width={96}
                        height={96}
                        className="w-full h-full object-contain"
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
                  </LocalizedClientLink>
                ) : (
                  <div className="w-24 small:w-20 h-24 small:h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {rule.product_thumbnail ? (
                      <Image
                        src={rule.product_thumbnail}
                        alt={rule.product_title || "Product"}
                        width={96}
                        height={96}
                        className="w-full h-full object-contain"
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
                )}

                {/* Product Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    {rule.product_id && productHandles[rule.product_id] ? (
                      <LocalizedClientLink
                        href={`/products/${productHandles[rule.product_id]}`}
                        className="block group"
                      >
                        <h4 className="font-medium text-sm small:text-base line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                          {rule.product_title || "Unknown Product"}
                        </h4>
                      </LocalizedClientLink>
                    ) : (
                      <h4 className="font-medium text-sm small:text-base line-clamp-2 mb-1">
                        {rule.product_title || "Unknown Product"}
                      </h4>
                    )}
                    {rule.variant_title && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                        {rule.variant_title}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-primary font-bold text-base small:text-lg">
                        {rule.required_points.toLocaleString()} pts
                      </span>
                      {rule.daily_limit && (
                        <span className="text-xs text-muted-foreground">
                          Limit {rule.daily_limit}/day
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Redeem Button */}
              <button
                onClick={() => handleRedeem(rule)}
                disabled={!canRedeem || isLoading}
                className={clsx(
                  "w-full mt-3 small:mt-4 py-2.5 small:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  canRedeem && !isLoading
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
                aria-label={
                  isSelected && isLoading
                    ? "Redeeming product"
                    : canAfford
                    ? `Redeem ${rule.product_title} for ${rule.required_points} points`
                    : `Not enough points to redeem ${rule.product_title}`
                }
              >
                {isSelected && isLoading
                  ? "Redeeming..."
                  : canAfford
                  ? "Redeem Now"
                  : "Not Enough Points"}
              </button>
            </div>
          )
        })}
      </div>

      {/* Redeemed Products List */}
      <div className="mt-6 small:mt-8 pt-4 small:pt-6 border-t border-border">
        <h4 className="text-base font-medium mb-3 small:mb-4 flex items-center gap-2">
          <FaBox className="h-5 w-5 text-primary" />
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
                  className="flex flex-col small:flex-row items-start small:items-center gap-3 small:gap-4 p-3 small:p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  {/* Product Image */}
                  <div className="w-full small:w-14 h-32 small:h-14 bg-muted rounded-lg overflow-hidden flex-shrink-0">
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

                  <div className="flex-1 min-w-0 w-full small:w-auto">
                    <div className="flex items-center gap-2 small:gap-3 flex-wrap mb-1">
                      <span className="font-mono font-bold text-sm small:text-base text-primary select-all break-all">
                        {reward.code}
                      </span>
                    </div>
                    <p className="text-xs small:text-sm text-muted-foreground line-clamp-2 small:truncate mb-2 small:mb-0">
                      {reward.product_title}
                    </p>
                    <div className="flex items-center gap-2 small:gap-3 text-xs text-muted-foreground flex-wrap">
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
                    className="w-full small:w-auto px-3 py-2 small:py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors flex items-center justify-center gap-1 min-h-[44px] small:min-h-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label={`Copy code ${reward.code}`}
                  >
                    <FaCopy className="h-4 w-4" />
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
