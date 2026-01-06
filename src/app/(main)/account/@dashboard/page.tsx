import { Metadata } from "next"

import Overview from "@modules/account/components/overview"
import { notFound } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"
import { getPageTitle } from "@lib/data/page-title-config"

export async function generateMetadata(): Promise<Metadata> {
  const title = await getPageTitle("account", { title: "Account" })
  return {
    title,
    description: "Overview of your account activity.",
  }
}

export default async function OverviewTemplate() {
  const customer = await retrieveCustomer().catch(() => null)
  const ordersResult = await listOrders(5, 0).catch(() => null)
  const orders = ordersResult?.orders || null

  if (!customer) {
    notFound()
  }

  return <Overview customer={customer} orders={orders} />
}
