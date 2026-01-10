"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import ShoppingBag from "@modules/common/icons/shopping-bag"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"
import { useAffiliateTracking } from "@modules/cart/hooks/use-affiliate-tracking"

const CartDropdown = ({
  cart: cartState,
}: {
  cart?: HttpTypes.StoreCart | null
}) => {
  // 同步 Affiliate Code 到购物车 metadata
  useAffiliateTracking(cartState || null)
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timer | undefined>(
    undefined
  )
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const totalItems =
    cartState?.items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  // 计算税后 subtotal：item_subtotal + tax_total - discount_subtotal
  const itemSubtotal = cartState?.item_subtotal ?? cartState?.subtotal ?? 0
  const taxTotal = cartState?.tax_total ?? 0
  // 使用 discount_subtotal（不含税折扣）而不是 discount_total（含税折扣）
  const discountSubtotal = (cartState as any)?.discount_subtotal ?? 0
  // 税后价格 = 税前价格 + 税费 - 折扣
  const subtotalWithTax = itemSubtotal + taxTotal - discountSubtotal
  const itemRef = useRef<number>(totalItems || 0)

  const timedOpen = () => {
    open()

    const timer = setTimeout(close, 5000)

    setActiveTimer(timer)
  }

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }

    open()
  }

  // Clean up the timer when the component unmounts
  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname()

  // open cart dropdown when modifying the cart items, but only if we're not on the cart page
  useEffect(() => {
    if (itemRef.current !== totalItems && !pathname.includes("/cart")) {
      timedOpen()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems, itemRef.current])

  return (
    <div
      className="h-full z-50"
      onMouseEnter={openAndCancel}
      onMouseLeave={close}
    >
      <Popover className="relative h-full">
        <PopoverButton className="h-full focus:outline-none">
          <LocalizedClientLink
            className="hover:text-primary transition-colors text-ui-fg-subtle p-2 h-full flex items-center justify-center relative"
            href="/cart"
            data-testid="nav-cart-link"
            aria-label={`Cart (${totalItems} items)`}
          >
            <div className="relative">
              <ShoppingBag size="20" />
              {totalItems > 0 && (
                <span className="absolute bottom-0 right-0 bg-primary text-primary-foreground text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5 leading-none transform translate-x-1/2 translate-y-1/2">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </div>
          </LocalizedClientLink>
        </PopoverButton>
        <Transition
          show={cartDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <PopoverPanel
            static
            className="hidden small:block absolute top-[calc(100%+1px)] right-0 bg-card border border-border w-[320px] text-foreground shadow-xl rounded-b-lg overflow-hidden"
            data-testid="nav-cart-dropdown"
          >
            <div className="p-3 flex items-center justify-center border-b border-border bg-muted/20">
              <h3 className="text-base-semi font-bold">Cart</h3>
            </div>
            {cartState && cartState.items?.length ? (
              <>
                <div className="overflow-y-auto max-h-[300px] px-3 grid grid-cols-1 gap-y-4 no-scrollbar py-4">
                  {cartState.items
                    .sort((a, b) => {
                      return (a.created_at ?? "") > (b.created_at ?? "")
                        ? -1
                        : 1
                    })
                    .map((item) => (
                      <div
                        className="grid grid-cols-[64px_1fr] gap-x-3 group/item"
                        key={item.id}
                        data-testid="cart-item"
                      >
                        <LocalizedClientLink
                          href={`/products/${item.product_handle}`}
                          className="w-16 h-16 overflow-hidden rounded-md border border-border"
                        >
                          <Thumbnail
                            thumbnail={item.thumbnail}
                            images={item.variant?.images || item.variant?.product?.images}
                            size="square"
                          />
                        </LocalizedClientLink>
                        <div className="flex flex-col justify-between flex-1 overflow-hidden">
                          <div className="flex flex-col flex-1">
                            <div className="flex items-start justify-between gap-x-2">
                              <div className="flex flex-col flex-1 overflow-hidden">
                                <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
                                  <LocalizedClientLink
                                    href={`/products/${item.product_handle}`}
                                    data-testid="product-link"
                                    className="hover:text-primary transition-colors"
                                  >
                                    {item.title}
                                  </LocalizedClientLink>
                                </h3>
                                <div className="text-muted-foreground text-[10px] mt-0.5">
                                  <LineItemOptions
                                    variant={item.variant}
                                    data-testid="cart-item-variant"
                                    data-value={item.variant}
                                  />
                                </div>
                                <span
                                  className="text-muted-foreground text-[10px] mt-0.5"
                                  data-testid="cart-item-quantity"
                                  data-value={item.quantity}
                                >
                                  Qty: {item.quantity}
                                </span>
                              </div>
                              <div className="flex justify-end font-medium text-foreground shrink-0 text-sm">
                                <LineItemPrice
                                  item={item}
                                  style="tight"
                                  currencyCode={cartState.currency_code}
                                  showPreTaxPrice={true}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <DeleteButton
                              id={item.id}
                              item={item}
                              className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                              data-testid="cart-item-remove-button"
                            >
                              Remove
                            </DeleteButton>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="p-3 flex flex-col gap-y-3 text-sm border-t border-border bg-muted/10">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">
                      Subtotal{" "}
                      <span className="text-[10px] italic">(incl. taxes)</span>
                    </span>
                    <span
                      className="text-base-semi font-bold text-foreground"
                      data-testid="cart-subtotal"
                      data-value={subtotalWithTax}
                    >
                      {convertToLocale({
                        amount: subtotalWithTax,
                        currency_code: cartState.currency_code,
                      })}
                    </span>
                  </div>
                  <LocalizedClientLink href="/cart" passHref>
                    <Button
                      variant="primary"
                      className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white border-none !border-2 !border-orange-600 hover:!border-orange-700 dark:!border-orange-600 dark:hover:!border-orange-700 disabled:!border-ui-border-base !shadow-none text-sm py-2"
                      style={{ borderColor: 'rgb(234 88 12)', borderWidth: '2px', borderStyle: 'solid' }}
                      size="default"
                      data-testid="go-to-cart-button"
                    >
                      Go to cart
                    </Button>
                  </LocalizedClientLink>
                </div>
              </>
            ) : (
              <div className="p-6">
                <div className="flex py-12 flex-col gap-y-3 items-center justify-center bg-muted/20 rounded-lg border border-dashed border-border">
                  <div className="bg-primary text-primary-foreground text-xs flex items-center justify-center w-7 h-7 rounded-full shadow-sm">
                    <span>0</span>
                  </div>
                  <span className="text-muted-foreground font-medium text-sm">Your bag is empty.</span>
                  <div>
                    <LocalizedClientLink href="/products">
                      <Button 
                        variant="secondary" 
                        onClick={close}
                        className="mt-2 border-border text-sm py-2"
                        size="default"
                      >
                        Explore products
                      </Button>
                    </LocalizedClientLink>
                  </div>
                </div>
              </div>
            )}
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  )
}

export default CartDropdown
