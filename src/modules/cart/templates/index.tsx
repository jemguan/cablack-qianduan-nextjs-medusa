"use client"

import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"
import { useBundlePromotionSync } from "../hooks/useBundlePromotionSync"
import { useVipDiscountSync } from "../hooks/useVipDiscountSync"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  // 监听购物车变化，同步捆绑包折扣
  useBundlePromotionSync(cart)
  
  // VIP 会员自动应用专属折扣码
  useVipDiscountSync(cart, customer)
  
  return (
    <div className="py-6 small:py-12 bg-background min-h-screen">
      <div className="content-container px-4 small:px-0" data-testid="cart-container">
        {cart?.items?.length ? (
          <div className="flex flex-col small:grid small:grid-cols-[1fr_360px] gap-6 small:gap-x-8 lg:gap-x-24">
            <div className="flex flex-col bg-card border border-border rounded-lg p-4 small:p-6 gap-y-6 shadow-sm overflow-visible small:overflow-hidden">
              {!customer && (
                <>
                  <SignInPrompt />
                  <Divider className="bg-border" />
                </>
              )}
              <ItemsTemplate cart={cart} />
            </div>
            <div className="relative">
              <div className="flex flex-col gap-y-8 small:sticky small:top-12">
                {cart && cart.region && (
                  <>
                    <div className="bg-card border border-border rounded-lg p-4 small:p-6 shadow-sm">
                      <Summary cart={cart as any} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <EmptyCartMessage />
          </div>
        )}
      </div>
    </div>
  )
}

export default CartTemplate
