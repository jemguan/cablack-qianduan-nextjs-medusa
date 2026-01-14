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
    <div className="bg-card border border-border/50 rounded-xl p-5 flex flex-col shadow-sm transition-all duration-200 hover:shadow-md hover:border-border" data-testid="order-card">
      <div className="flex items-center justify-between mb-3">
        <div className="uppercase text-base-semi text-foreground">
          Order #<span data-testid="order-display-id">{order.display_id}</span>
        </div>
        <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
          {convertToLocale({
            amount: order.total,
            currency_code: order.currency_code,
          })}
        </div>
      </div>
      <div className="flex items-center gap-x-3 text-xs text-muted-foreground mb-4">
        <span data-testid="order-created-at">
          {new Date(order.created_at).toDateString()}
        </span>
        <span className="text-border">•</span>
        <span>{`${numberOfLines} ${numberOfLines > 1 ? "items" : "item"}`}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {order.items?.slice(0, 2).map((i) => {
          return (
            <div
              key={i.id}
              className="flex flex-col gap-y-2"
              data-testid="order-item"
            >
              <Thumbnail thumbnail={i.thumbnail} images={[]} size="square" className="rounded-lg border border-border/50 overflow-hidden" />
              <div className="flex items-start gap-x-1 text-xs">
                <span
                  className="font-medium text-foreground truncate flex-1"
                  data-testid="item-title"
                  title={i.title}
                >
                  {i.title}
                </span>
                <span className="text-muted-foreground">×</span>
                <span className="text-foreground font-semibold" data-testid="item-quantity">{i.quantity}</span>
              </div>
            </div>
          )
        })}
        {numberOfProducts > 2 && (
          <div className="w-full aspect-square flex flex-col items-center justify-center bg-muted/30 rounded-lg border border-dashed border-border/50">
            <span className="text-sm text-foreground font-semibold">
              +{numberOfProducts - 2}
            </span>
            <span className="text-xs text-muted-foreground uppercase">more</span>
          </div>
        )}
      </div>
      <div className="flex justify-end pt-4 border-t border-border/50">
        <LocalizedClientLink 
          href={`/account/orders/details/${order.id}`} 
          className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
          aria-label={`View order #${order.display_id} details`}
        >
          <Button 
            data-testid="order-details-link" 
            variant="secondary" 
            size="small" 
            className="bg-muted hover:bg-muted/80 text-foreground border-border hover:border-primary/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            See details
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderCard
