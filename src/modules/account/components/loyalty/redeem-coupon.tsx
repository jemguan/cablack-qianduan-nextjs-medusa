"use client"

import { useState, useCallback, useEffect } from "react"
import { LoyaltyAccount, LoyaltyConfig, LoyaltyTransaction } from "@/types/loyalty"
import { redeemCoupon, refreshLoyaltyCache, getLoyaltyTransactions } from "@lib/data/loyalty"
import clsx from "clsx"

interface RedeemCouponProps {
  account: LoyaltyAccount
  config: LoyaltyConfig
  onSuccess?: () => void
}

interface RedeemedCoupon {
  code: string
  amount: number
  points_used: number
  created_at: string
}

const QUICK_AMOUNTS = [100, 300, 500, 1000]

export default function RedeemCoupon({
  account,
  config,
  onSuccess,
}: RedeemCouponProps) {
  const [points, setPoints] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    code?: string
    amount?: number
    error?: string
  } | null>(null)
  const [redeemedCoupons, setRedeemedCoupons] = useState<RedeemedCoupon[]>([])
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(true)
  const [couponPage, setCouponPage] = useState(1)
  const couponPageSize = 6

  const discountAmount = points / config.coupon_redemption_rate
  const canRedeem = points > 0 && points <= account.points

  // 加载已兑换的优惠码
  useEffect(() => {
    const loadRedeemedCoupons = async () => {
      try {
        // 获取所有交易记录，筛选出兑换优惠券的记录
        const result = await getLoyaltyTransactions({ page: 1, limit: 100 })
        const couponTransactions = result.transactions.filter(
          (tx: LoyaltyTransaction) => tx.type === "REDEEM_COUPON" && tx.metadata?.promotion_code
        )
        const coupons: RedeemedCoupon[] = couponTransactions.map((tx: LoyaltyTransaction) => ({
          code: tx.metadata?.promotion_code || "",
          amount: tx.metadata?.discount_amount || 0,
          points_used: Math.abs(tx.amount),
          created_at: tx.created_at,
        }))
        setRedeemedCoupons(coupons)
      } catch (error) {
        console.error("Failed to load redeemed coupons:", error)
      } finally {
        setIsLoadingCoupons(false)
      }
    }
    loadRedeemedCoupons()
  }, [])

  // 复制优惠码到剪贴板
  const handleCopyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      // 可以添加复制成功的提示
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }, [])

  const handleRedeem = async () => {
    if (!canRedeem) return

    setIsLoading(true)
    setResult(null)

    try {
      const response = await redeemCoupon(points)
      setResult({
        success: true,
        code: response.promotion_code,
        amount: response.discount_amount,
      })
      // 添加到已兑换列表
      setRedeemedCoupons((prev) => [
        {
          code: response.promotion_code,
          amount: response.discount_amount,
          points_used: points,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])
      setPoints(0)
      await refreshLoyaltyCache()
      // 不立即调用 onSuccess，让用户先看到并复制优惠码
      // onSuccess?.() 将在用户点击"查看交易记录"时调用
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || "Redemption failed, please try again",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickSelect = (amount: number) => {
    if (amount <= account.points) {
      setPoints(amount)
      setResult(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Redeem Points for Coupons</h3>
        <p className="text-sm text-muted-foreground">
          Use your points to get discount coupons for checkout
        </p>
      </div>

      {/* Quick Select */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Quick Select</label>
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => handleQuickSelect(amount)}
              disabled={amount > account.points}
              className={clsx(
                "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                points === amount
                  ? "bg-primary text-primary-foreground border-primary"
                  : amount <= account.points
                  ? "border-border hover:bg-muted"
                  : "border-border opacity-50 cursor-not-allowed"
              )}
            >
              {amount} pts
            </button>
          ))}
        </div>
      </div>

      {/* Custom Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Custom Amount</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={points || ""}
            onChange={(e) => {
              setPoints(parseInt(e.target.value) || 0)
              setResult(null)
            }}
            min={0}
            max={account.points}
            placeholder="Enter points amount"
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={() => {
              setPoints(account.points)
              setResult(null)
            }}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
          >
            Max
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Available points: {account.points.toLocaleString()}
        </p>
      </div>

      {/* Preview */}
      {points > 0 && (
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Points to redeem</span>
            <span className="font-medium">{points.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-muted-foreground">Coupon value</span>
            <span className="text-lg font-bold text-primary">
              ${discountAmount.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Redeem Button */}
      <button
        onClick={handleRedeem}
        disabled={!canRedeem || isLoading}
        className={clsx(
          "w-full py-3 rounded-lg font-medium transition-colors",
          canRedeem && !isLoading
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
      >
        {isLoading ? "Redeeming..." : "Redeem Now"}
      </button>

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
            <div className="text-center">
              <p className="text-green-700 dark:text-green-300 font-medium">
                🎉 Redemption Successful!
              </p>
              <div className="mt-3 bg-white dark:bg-gray-900 rounded-lg p-3 border border-green-300 dark:border-green-700">
                <p className="text-xs text-muted-foreground mb-1">Your coupon code</p>
                <p className="text-2xl font-mono font-bold text-green-800 dark:text-green-200 select-all">
                  {result.code}
                </p>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                Coupon value: <span className="font-bold">${result.amount?.toFixed(2)}</span>
              </p>
              <div className="flex gap-2 mt-4 justify-center">
                <button
                  onClick={() => result.code && handleCopyCode(result.code)}
                  className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  📋 Copy Code
                </button>
                <button
                  onClick={() => {
                    setResult(null)
                    onSuccess?.()
                  }}
                  className="px-4 py-2 text-sm border border-green-600 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                  View History
                </button>
              </div>
              <p className="text-xs text-green-500 dark:text-green-500 mt-3">
                Enter this code at checkout to apply the discount
              </p>
            </div>
          ) : (
            <p className="text-red-700 dark:text-red-300">{result.error}</p>
          )}
        </div>
      )}

      {/* Redeemed Coupons List */}
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
              d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
            />
          </svg>
          My Coupons
        </h4>
        
        {isLoadingCoupons ? (
          <div className="text-center py-6 text-muted-foreground">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading...
          </div>
        ) : redeemedCoupons.length === 0 ? (
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
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
            <p>No redeemed coupons yet</p>
            <p className="text-xs mt-1">Coupons you redeem will appear here</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {redeemedCoupons
                .slice((couponPage - 1) * couponPageSize, couponPage * couponPageSize)
                .map((coupon, index) => (
                <div
                  key={`${coupon.code}-${index}`}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-lg text-primary select-all">
                        {coupon.code}
                      </span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                        ${coupon.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{coupon.points_used.toLocaleString()} pts used</span>
                      <span>·</span>
                      <span>
                        {new Date(coupon.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyCode(coupon.code)}
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
            {redeemedCoupons.length > couponPageSize && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setCouponPage((p) => Math.max(1, p - 1))}
                  disabled={couponPage === 1}
                  className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  {couponPage} / {Math.ceil(redeemedCoupons.length / couponPageSize)}
                </span>
                <button
                  onClick={() => setCouponPage((p) => Math.min(Math.ceil(redeemedCoupons.length / couponPageSize), p + 1))}
                  disabled={couponPage >= Math.ceil(redeemedCoupons.length / couponPageSize)}
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
