"use client"

import { Button, Heading } from "@medusajs/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)

  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h2" className="text-xl small:text-[2rem] leading-tight small:leading-[2.75rem] text-foreground">
        Summary
      </Heading>
      <div className="text-foreground">
        <DiscountCode cart={cart} />
      </div>
      <Divider className="bg-border" />
      <div className="text-foreground">
        <CartTotals totals={cart} />
      </div>
      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
      >
        <Button className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90">Go to checkout</Button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
