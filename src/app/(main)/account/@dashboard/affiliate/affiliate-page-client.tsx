"use client"

import { HttpTypes } from "@medusajs/types"
import type { AffiliateData, StatsData } from "./types"
import {
  usePaymentHistory,
  useAutoApproveConfig,
  useCopyToClipboard,
} from "./hooks"
import {
  StatsOverview,
  AffiliateLinkCard,
  ProductLinkGenerator,
  CommissionsList,
  PaymentHistoryList,
  CommissionSettings,
} from "./components"

interface AffiliatePageClientProps {
  customer: HttpTypes.StoreCustomer
  initialAffiliateData: AffiliateData | null
  initialStatsData: StatsData | null
}

export default function AffiliatePageClient({
  customer,
  initialAffiliateData,
  initialStatsData,
}: AffiliatePageClientProps) {
  const { copiedLink, copiedCode, copiedProductLink, copyToClipboard } = useCopyToClipboard()
  const autoApproveDays = useAutoApproveConfig()
  const { paymentHistory, isLoading: isLoadingPaymentHistory } = usePaymentHistory(
    !!initialAffiliateData?.affiliate
  )

  // 未注册 Affiliate 的情况
  if (!initialAffiliateData?.affiliate) {
    return (
      <div className="w-full">
        <div className="mb-4 small:mb-8">
          <h1 className="text-2xl-semi text-foreground">Affiliate Program</h1>
          <p className="text-base-regular text-muted-foreground mt-2">
            You are not an Affiliate yet. Please contact the administrator to apply.
          </p>
        </div>
      </div>
    )
  }

  const affiliate = initialAffiliateData.affiliate
  const stats = initialStatsData?.stats || affiliate.stats
  const commissions = initialStatsData?.recent_commissions || []

  return (
    <div className="w-full space-y-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl-semi text-foreground">Affiliate Program</h1>
        <p className="text-base-regular text-muted-foreground mt-2">
          Promote products and earn commissions
        </p>
      </div>

      {/* 专属链接和折扣码 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 small:gap-6">
        <AffiliateLinkCard
          title="Your Affiliate Link"
          value={affiliate.affiliate_link}
          isCopied={copiedLink}
          onCopy={() => copyToClipboard(affiliate.affiliate_link, "link")}
        />
        <AffiliateLinkCard
          title="Your Discount Code"
          value={affiliate.discount_code}
          isCopied={copiedCode}
          onCopy={() => copyToClipboard(affiliate.discount_code, "code")}
          isMono
        />
      </div>

      {/* 数据概览 */}
      <StatsOverview stats={stats} />

      {/* 提成比例 */}
      <CommissionSettings commissionRate={affiliate.commission_rate} />

      {/* 产品推广链接生成器 */}
      <ProductLinkGenerator
        affiliateLink={affiliate.affiliate_link}
        copiedProductLink={copiedProductLink}
        onCopy={copyToClipboard}
      />

      {/* 最近佣金记录和提现记录 - 并排显示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 small:gap-6">
        <CommissionsList commissions={commissions} autoApproveDays={autoApproveDays} />
        <PaymentHistoryList paymentHistory={paymentHistory} isLoading={isLoadingPaymentHistory} />
      </div>
    </div>
  )
}
