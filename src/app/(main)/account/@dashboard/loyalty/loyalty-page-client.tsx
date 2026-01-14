"use client"

import { useState, useCallback } from "react"
import {
  LoyaltyAccount,
  LoyaltyConfig,
  LoyaltyTransaction,
  RewardRule,
} from "@/types/loyalty"
import {
  LoyaltyOverview,
  LoyaltyTransactions,
  RedeemCoupon,
  RedeemProducts,
} from "@modules/account/components/loyalty"
import clsx from "clsx"

interface LoyaltyPageClientProps {
  account: LoyaltyAccount
  config: LoyaltyConfig
  recentTransactions: LoyaltyTransaction[]
  rewardRules: RewardRule[]
}

type TabType = "overview" | "transactions" | "coupon" | "products"

const TABS: { id: TabType; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "transactions", label: "History" },
  { id: "coupon", label: "Redeem Coupons" },
  { id: "products", label: "Redeem Products" },
]

export default function LoyaltyPageClient({
  account,
  config,
  recentTransactions,
  rewardRules,
}: LoyaltyPageClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRedeemSuccess = useCallback(() => {
    // 刷新页面数据，但保留在当前页面
    setRefreshKey((k) => k + 1)
  }, [])

  return (
    <div className="space-y-4 small:space-y-6">
      {/* 标签页 */}
      <div className="border-b border-border/50">
        <nav className="flex gap-4 small:gap-8 -mb-px overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px]",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/50"
              )}
              aria-label={`Switch to ${tab.label} tab`}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 内容区域 */}
      <div key={refreshKey}>
        {activeTab === "overview" && (
          <LoyaltyOverview account={account} config={config} />
        )}

        {activeTab === "transactions" && (
          <LoyaltyTransactions
            initialTransactions={recentTransactions}
            totalCount={recentTransactions.length}
          />
        )}

        {activeTab === "coupon" && (
          <RedeemCoupon
            account={account}
            config={config}
            onSuccess={handleRedeemSuccess}
          />
        )}

        {activeTab === "products" && (
          <RedeemProducts
            rules={rewardRules}
            account={account}
            onSuccess={handleRedeemSuccess}
          />
        )}
      </div>
    </div>
  )
}
