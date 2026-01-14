import { Metadata } from "next"
import { notFound } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import { getLoyaltyAccount, getRewardRules } from "@lib/data/loyalty"
import { getPageTitle } from "@lib/data/page-title-config"
import LoyaltyPageClient from "./loyalty-page-client"

export async function generateMetadata(): Promise<Metadata> {
  const title = await getPageTitle("account_loyalty", { title: "Rewards" })
  return {
    title,
    description: "View your points balance, transaction history, and redeem coupons or products.",
  }
}

export default async function LoyaltyPage() {
  const customer = await retrieveCustomer()

  if (!customer) {
    notFound()
  }

  // 获取积分账户和可兑换商品
  const [loyaltyData, rewardRulesData] = await Promise.all([
    getLoyaltyAccount(),
    getRewardRules(),
  ])

  if (!loyaltyData) {
    return (
      <div className="w-full" data-testid="loyalty-page-wrapper">
        <div className="mb-4 small:mb-8 flex flex-col gap-y-3 small:gap-y-4">
          <h1 className="text-2xl-semi">Rewards</h1>
          <p className="text-base-regular text-muted-foreground">
            The rewards system is temporarily unavailable. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full" data-testid="loyalty-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">Rewards</h1>
        <p className="text-base-regular text-muted-foreground">
          View your points balance, transaction history, and redeem coupons or products.
        </p>
      </div>

      <LoyaltyPageClient
        account={loyaltyData.account}
        config={loyaltyData.config}
        recentTransactions={loyaltyData.recent_transactions}
        rewardRules={rewardRulesData.rules}
      />
    </div>
  )
}
