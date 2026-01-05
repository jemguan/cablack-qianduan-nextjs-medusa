"use client"

import { Button } from "@medusajs/ui"

import OrderCard from "../order-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { Pagination } from "@modules/store/components/pagination"

interface OrderOverviewProps {
  orders: HttpTypes.StoreOrder[]
  page: number
  totalPages: number
}

const OrderOverview = ({ orders, page, totalPages }: OrderOverviewProps) => {
  if (orders?.length) {
    return (
      <>
        <div className="grid grid-cols-1 small:grid-cols-2 gap-4 w-full">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
        <Pagination page={page} totalPages={totalPages} data-testid="orders-pagination" />
      </>
    )
  }

  return (
    <div
      className="w-full flex flex-col items-center gap-y-4"
      data-testid="no-orders-container"
    >
      <h2 className="text-large-semi">Nothing to see here</h2>
      <p className="text-base-regular">
        You don&apos;t have any orders yet, let us change that {":)"}
      </p>
      <div className="mt-4">
        <LocalizedClientLink href="/" passHref>
          <Button data-testid="continue-shopping-button">
            Continue shopping
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderOverview
