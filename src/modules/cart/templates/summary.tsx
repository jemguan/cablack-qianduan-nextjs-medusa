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

const Summary = ({ cart }: SummaryProps) => {
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
        href={"/checkout"}
        data-testid="checkout-button"
      >
        <Button 
          variant="primary"
          className="w-full h-10 bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white border-none !border-2 !border-orange-600 hover:!border-orange-700 dark:!border-orange-600 dark:hover:!border-orange-700 disabled:!border-ui-border-base !shadow-none"
          style={{ borderColor: 'rgb(234 88 12)', borderWidth: '2px', borderStyle: 'solid' }}
        >
          Go to checkout
        </Button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
