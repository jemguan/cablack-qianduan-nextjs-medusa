import { retrieveCustomer } from "@lib/data/customer"
import { notFound, redirect } from "next/navigation"
import AffiliatePageClient from "./affiliate-page-client"
import { getAffiliateData, getAffiliateStats } from "@lib/data/affiliate"

export default async function AffiliatePage() {
  const customer = await retrieveCustomer()

  if (!customer) {
    notFound()
  }

  // 在服务端获取数据
  const affiliateData = await getAffiliateData()
  
  // 如果用户不是 Affiliate，重定向到账户首页
  if (!affiliateData?.affiliate) {
    redirect("/account")
  }
  
  const statsData = await getAffiliateStats()

  return (
    <AffiliatePageClient 
      customer={customer} 
      initialAffiliateData={affiliateData}
      initialStatsData={statsData}
    />
  )
}
