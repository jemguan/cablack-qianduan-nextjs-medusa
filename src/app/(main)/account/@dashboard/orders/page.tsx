import { Metadata } from "next"

import OrderOverview from "@modules/account/components/order-overview"
import { notFound } from "next/navigation"
import { listOrders } from "@lib/data/orders"
import Divider from "@modules/common/components/divider"
import TransferRequestForm from "@modules/account/components/transfer-request-form"

export const metadata: Metadata = {
  title: "Orders",
  description: "Overview of your previous orders.",
}

interface OrdersPageProps {
  searchParams: { page?: string }
}

export default async function Orders({ searchParams }: OrdersPageProps) {
  const page = Number(searchParams.page) || 1
  const limit = 4 // 一页4个订单（2行 x 2列）
  const offset = (page - 1) * limit

  const { orders, count } = await listOrders(limit, offset)

  if (!orders) {
    notFound()
  }

  const totalPages = Math.ceil(count / limit)

  return (
    <div className="w-full" data-testid="orders-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">Orders</h1>
        <p className="text-base-regular">
          View your previous orders and their status. You can also create
          returns or exchanges for your orders if needed.
        </p>
      </div>
      <div>
        <OrderOverview orders={orders} page={page} totalPages={totalPages} />
        <Divider className="my-16" />
        <TransferRequestForm />
      </div>
    </div>
  )
}
