"use client"

import { convertToLocale } from "@lib/util/money"
import { CheckCircleSolid, XMark } from "@medusajs/icons"
import {
  HttpTypes,
  StoreCart,
  StoreCartShippingOption,
  StorePrice,
} from "@medusajs/types"
import { Button, clx } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useState, useEffect } from "react"
import { StoreFreeShippingPrice } from "types/global"

const computeTarget = (
  cart: HttpTypes.StoreCart,
  price: HttpTypes.StorePrice
) => {
  const priceRule = (price.price_rules || []).find(
    (pr) => pr.attribute === "item_total"
  )!

  const currentAmount = cart.item_total
  const targetAmount = parseFloat(priceRule.value)

  if (priceRule.operator === "gt") {
    return {
      current_amount: currentAmount,
      target_amount: targetAmount,
      target_reached: currentAmount > targetAmount,
      target_remaining:
        currentAmount > targetAmount ? 0 : targetAmount + 1 - currentAmount,
      remaining_percentage: (currentAmount / targetAmount) * 100,
    }
  } else if (priceRule.operator === "gte") {
    return {
      current_amount: currentAmount,
      target_amount: targetAmount,
      target_reached: currentAmount > targetAmount,
      target_remaining:
        currentAmount > targetAmount ? 0 : targetAmount - currentAmount,
      remaining_percentage: (currentAmount / targetAmount) * 100,
    }
  } else if (priceRule.operator === "lt") {
    return {
      current_amount: currentAmount,
      target_amount: targetAmount,
      target_reached: targetAmount > currentAmount,
      target_remaining:
        targetAmount > currentAmount ? 0 : currentAmount + 1 - targetAmount,
      remaining_percentage: (currentAmount / targetAmount) * 100,
    }
  } else if (priceRule.operator === "lte") {
    return {
      current_amount: currentAmount,
      target_amount: targetAmount,
      target_reached: targetAmount > currentAmount,
      target_remaining:
        targetAmount > currentAmount ? 0 : currentAmount - targetAmount,
      remaining_percentage: (currentAmount / targetAmount) * 100,
    }
  } else {
    return {
      current_amount: currentAmount,
      target_amount: targetAmount,
      target_reached: currentAmount === targetAmount,
      target_remaining:
        targetAmount > currentAmount ? 0 : targetAmount - currentAmount,
      remaining_percentage: (currentAmount / targetAmount) * 100,
    }
  }
}

export default function ShippingPriceNudge({
  variant = "progress-bar",
  cart,
  shippingOptions,
}: {
  variant?: "popup" | "inline" | "progress-bar"
  cart: StoreCart
  shippingOptions: StoreCartShippingOption[]
}) {
  if (!cart || !shippingOptions?.length) {
    return null
  }

  // Check if any shipping options have a conditional price based on item_total
  // Only show component if there are actual free shipping options available
  const hasFreeShippingOptions = shippingOptions.some((shippingOption) => {
    return shippingOption.prices.some(
      (price) =>
        price.currency_code === cart.currency_code &&
        price.amount === 0 &&
        (price.price_rules || []).some(
          (priceRule) => priceRule.attribute === "item_total"
        )
    )
  })

  // If no free shipping options exist for this country, don't show the component
  if (!hasFreeShippingOptions) {
    return null
  }

  const freeShippingPrice = shippingOptions
    .map((shippingOption) => {
      const calculatedPrice = shippingOption.calculated_price

      if (!calculatedPrice) {
        return
      }

      // Get all prices that are:
      // 1. Currency code is same as the cart's
      // 2. Have a rule that is set on item_total
      const validCurrencyPrices = shippingOption.prices.filter(
        (price) =>
          price.currency_code === cart.currency_code &&
          (price.price_rules || []).some(
            (priceRule) => priceRule.attribute === "item_total"
          )
      )

      return validCurrencyPrices.map((price) => {
        return {
          ...price,
          shipping_option_id: shippingOption.id,
          ...computeTarget(cart, price),
        }
      })
    })
    .flat(1)
    .filter(Boolean)
    // We focus here entirely on free shipping, but this can be edited to handle multiple layers
    // of reduced shipping prices.
    .find((price) => price?.amount === 0)

  if (!freeShippingPrice) {
    return null
  }

  if (variant === "popup") {
    return <FreeShippingPopup cart={cart} price={freeShippingPrice} />
  } else if (variant === "inline") {
    return <FreeShippingInline cart={cart} price={freeShippingPrice} />
  } else {
    return <FreeShippingProgressBar cart={cart} price={freeShippingPrice} />
  }
}

function FreeShippingInline({
  cart,
  price,
}: {
  cart: StoreCart
  price: StorePrice & {
    target_reached: boolean
    target_remaining: number
    remaining_percentage: number
  }
}) {
  return (
    <div className="bg-neutral-100 p-2 rounded-lg border">
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-neutral-600">
          <div>
            {price.target_reached ? (
              <div className="flex items-center gap-1.5">
                <CheckCircleSolid className="text-green-500 inline-block" />{" "}
                Free Shipping unlocked!
              </div>
            ) : (
              `Unlock Free Shipping`
            )}
          </div>

          <div
            className={clx("visible", {
              "opacity-0 invisible": price.target_reached,
            })}
          >
            Only{" "}
            <span className="text-neutral-950">
              {convertToLocale({
                amount: price.target_remaining,
                currency_code: cart.currency_code,
              })}
            </span>{" "}
            away
          </div>
        </div>
        <div className="flex justify-between gap-1">
          <div
            className={clx(
              "bg-gradient-to-r from-zinc-400 to-zinc-500 h-1 rounded-full max-w-full duration-500 ease-in-out",
              {
                "from-green-400 to-green-500": price.target_reached,
              }
            )}
            style={{ width: `${price.remaining_percentage}%` }}
          ></div>
          <div className="bg-neutral-300 h-1 rounded-full w-fit flex-grow"></div>
        </div>
      </div>
    </div>
  )
}

function FreeShippingProgressBar({
  cart,
  price,
}: {
  cart: StoreCart
  price: StorePrice & {
    target_reached: boolean
    target_remaining: number
    remaining_percentage: number
  }
}) {
  const [isClosed, setIsClosed] = useState(false)

  useEffect(() => {
    // 在开发环境中不检查持久化状态
    if (process.env.NODE_ENV === 'production') {
      const closedTimestamp = localStorage.getItem('freeShippingNudgeClosed')
      if (closedTimestamp) {
        const closedTime = parseInt(closedTimestamp)
        const now = Date.now()
        const oneHour = 60 * 60 * 1000 // 1小时 = 3600000毫秒

        // 如果关闭时间超过1小时，清除存储并显示组件
        if (now - closedTime > oneHour) {
          localStorage.removeItem('freeShippingNudgeClosed')
        } else {
          setIsClosed(true)
        }
      }
    }
  }, [])

  const handleClose = () => {
    setIsClosed(true)
    // 在开发环境中不持久化关闭状态
    if (process.env.NODE_ENV === 'production') {
      localStorage.setItem('freeShippingNudgeClosed', Date.now().toString())
    }
  }

  if (isClosed) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* 进度条容器 */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {price.target_reached ? (
                  <>
                    <CheckCircleSolid className="text-green-500 w-5 h-5" />
                    <span className="text-sm font-medium text-green-600">
                      Free Shipping Unlocked!
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium text-foreground">
                      Free Shipping
                    </span>
                    <span className="text-sm text-muted-foreground">
                      <span className="sm:inline hidden">Only </span>
                      <span className="font-semibold text-foreground">
                        {convertToLocale({
                          amount: price.target_remaining,
                          currency_code: cart.currency_code,
                        })}
                      </span>
                      <span className="sm:inline hidden"> away</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 进度条 */}
            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={clx(
                  "absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out",
                  {
                    "bg-gradient-to-r from-green-400 to-green-500": price.target_reached,
                    "bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 via-purple-400 to-pink-400": !price.target_reached,
                  }
                )}
                style={{
                  width: price.target_reached ? '100%' : `${Math.min(price.remaining_percentage, 100)}%`
                }}
              />
              {/* 进度条上的文本 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-foreground drop-shadow-sm">
                  {price.target_reached ? '100%' : `${Math.round(price.remaining_percentage)}%`}
                </span>
              </div>
            </div>
          </div>

          {/* 操作按钮和关闭按钮 */}
          <div className="flex items-center gap-2">
            {/* 操作按钮 */}
            {!price.target_reached && (
              <>
                {/* 在桌面端显示两个按钮，在移动端只显示继续购物按钮 */}
              <LocalizedClientLink
                className="hidden sm:inline-block px-3 py-2 text-sm font-medium text-muted-foreground bg-muted hover:bg-muted/80 rounded-md transition-colors"
                href="/cart"
              >
                  View Cart
                </LocalizedClientLink>
              <LocalizedClientLink
                className="px-3 sm:px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors"
                href="/products"
              >
                  Continue Shopping
                </LocalizedClientLink>
              </>
            )}

            {/* 关闭按钮 */}
            <Button
              className="rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground p-2 h-8 w-8 flex items-center justify-center transition-colors"
              onClick={handleClose}
            >
              <XMark className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FreeShippingPopup({
  cart,
  price,
}: {
  cart: StoreCart
  price: StoreFreeShippingPrice
}) {
  const [isClosed, setIsClosed] = useState(false)

  return (
    <div
      className={clx(
        "fixed bottom-4 right-4 small:bottom-5 small:right-5 flex flex-col items-end gap-2 transition-all duration-500 ease-in-out z-10",
        {
          "opacity-0 invisible delay-1000": price.target_reached,
          "opacity-0 invisible": isClosed,
          "opacity-100 visible": !price.target_reached && !isClosed,
        }
      )}
    >
      <div>
        <Button
          className="rounded-full bg-neutral-900 shadow-none outline-none border-none text-[15px] p-2"
          onClick={() => setIsClosed(true)}
        >
          <XMark />
        </Button>
      </div>

      <div className="w-[calc(100vw-2rem)] max-w-[400px] bg-black text-white p-4 small:p-6 rounded-lg">
        <div className="pb-3 small:pb-4">
          <div className="space-y-2 small:space-y-3">
            <div className="flex flex-col small:flex-row small:justify-between gap-1.5 small:gap-0 text-sm small:text-[15px] text-neutral-400">
              <div>
                {price.target_reached ? (
                  <div className="flex items-center gap-1.5">
                    <CheckCircleSolid className="text-green-500 inline-block" />{" "}
                    Free Shipping unlocked!
                  </div>
                ) : (
                  `Unlock Free Shipping`
                )}
              </div>

              <div
                className={clx("visible", {
                  "opacity-0 invisible": price.target_reached,
                })}
              >
                Only{" "}
                <span className="text-white">
                  {convertToLocale({
                    amount: price.target_remaining,
                    currency_code: cart.currency_code,
                  })}
                </span>{" "}
                away
              </div>
            </div>
            <div className="flex justify-between gap-1">
              <div
                className={clx(
                  "bg-gradient-to-r from-zinc-400 to-zinc-500 h-1.5 rounded-full max-w-full duration-500 ease-in-out",
                  {
                    "from-green-400 to-green-500": price.target_reached,
                  }
                )}
                style={{ width: `${price.remaining_percentage}%` }}
              ></div>
              <div className="bg-zinc-600 h-1.5 rounded-full w-fit flex-grow"></div>
            </div>
          </div>
        </div>

        <div className="flex flex-col small:flex-row gap-2 small:gap-3">
          <LocalizedClientLink
            className="rounded-2xl bg-transparent shadow-none outline-none border-[1px] border-white text-sm small:text-[15px] py-2 small:py-2.5 px-4 text-center"
            href="/cart"
          >
            View cart
          </LocalizedClientLink>

          <LocalizedClientLink
            className="rounded-2xl bg-white text-neutral-950 shadow-none outline-none border-[1px] border-white text-sm small:text-[15px] py-2 small:py-2.5 px-4 text-center"
            href="/products"
          >
            View products
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
