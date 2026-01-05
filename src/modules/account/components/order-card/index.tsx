import { Button } from "@medusajs/ui"
import { useMemo } from "react"

import Thumbnail from "@modules/products/components/thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OrderCardProps = {
  order: HttpTypes.StoreOrder
}

const OrderCard = ({ order }: OrderCardProps) => {
  const numberOfLines = useMemo(() => {
    return (
      order.items?.reduce((acc, item) => {
        return acc + item.quantity
      }, 0) ?? 0
    )
  }, [order])

  const numberOfProducts = useMemo(() => {
    return order.items?.length ?? 0
  }, [order])

  return (
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col shadow-sm transition-all hover:shadow-md" data-testid="order-card">
      <div className="uppercase text-base-semi mb-1 text-foreground">
        #<span data-testid="order-display-id">{order.display_id}</span>
      </div>
      <div className="flex items-center divide-x divide-border text-xs text-muted-foreground mb-3">
        <span className="pr-2" data-testid="order-created-at">
          {new Date(order.created_at).toDateString()}
        </span>
        <span className="px-2" data-testid="order-amount">
          {convertToLocale({
            amount: order.total,
            currency_code: order.currency_code,
          })}
        </span>
        <span className="pl-2">{`${numberOfLines} ${
          numberOfLines > 1 ? "items" : "item"
        }`}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {order.items?.slice(0, 2).map((i) => {
          return (
            <div
              key={i.id}
              className="flex flex-col gap-y-1"
              data-testid="order-item"
            >
              <Thumbnail thumbnail={i.thumbnail} images={[]} size="square" className="rounded-md border border-border" />
              <div className="flex items-center text-xs text-foreground">
                <span
                  className="font-semibold truncate"
                  data-testid="item-title"
                  title={i.title}
                >
                  {i.title}
                </span>
                <span className="ml-1 text-muted-foreground">x</span>
                <span data-testid="item-quantity">{i.quantity}</span>
              </div>
            </div>
          )
        })}
        {numberOfProducts > 2 && (
          <div className="w-full aspect-square flex flex-col items-center justify-center bg-muted/30 rounded-md border border-dashed border-border">
            <span className="text-xs text-foreground font-semibold">
              + {numberOfProducts - 2}
            </span>
            <span className="text-xs text-muted-foreground uppercase">more</span>
          </div>
        )}
      </div>
      <div className="flex justify-end pt-3 border-t border-border">
        <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
          <Button data-testid="order-details-link" variant="secondary" size="small" className="bg-muted hover:bg-muted/80 text-foreground border-border">
            See details
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderCard
