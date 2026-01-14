"use client"

import { Button } from "@medusajs/ui"
import { FaBox } from "react-icons/fa"

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
        <div className="grid grid-cols-1 small:grid-cols-2 gap-6 w-full">
        {orders.map((o) => (
            <OrderCard key={o.id} order={o} />
        ))}
      </div>
        <div className="mt-8">
          <Pagination page={page} totalPages={totalPages} data-testid="orders-pagination" />
        </div>
      </>
    )
  }

  return (
    <div
      className="w-full flex flex-col items-center justify-center py-16 px-4 text-center"
      data-testid="no-orders-container"
    >
      <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
        <FaBox className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-large-semi text-foreground mb-2">Nothing to see here</h2>
      <p className="text-base-regular text-muted-foreground mb-6 max-w-md">
        You don&apos;t have any orders yet, let us change that {":)"}
      </p>
      <LocalizedClientLink href="/" passHref>
        <Button 
          data-testid="continue-shopping-button"
          className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px]"
          aria-label="Continue shopping"
        >
          Continue shopping
        </Button>
      </LocalizedClientLink>
    </div>
  )
}

export default OrderOverview
