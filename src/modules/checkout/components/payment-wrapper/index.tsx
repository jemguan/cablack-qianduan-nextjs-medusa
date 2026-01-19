"use client"

import { loadStripe, Stripe } from "@stripe/stripe-js"
import React, { useState, useEffect } from "react"
import StripeWrapper from "./stripe-wrapper"
import { HttpTypes } from "@medusajs/types"
import { isStripeLike } from "@lib/constants"

type PaymentWrapperProps = {
  cart: HttpTypes.StoreCart
  children: React.ReactNode
}

const stripeKey =
  process.env.NEXT_PUBLIC_STRIPE_KEY ||
  process.env.NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY

const medusaAccountId = process.env.NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID

// 延迟加载 Stripe：使用缓存避免重复初始化
let stripePromiseCache: Promise<Stripe | null> | null = null

const getStripePromise = (): Promise<Stripe | null> | null => {
  if (!stripeKey) return null
  if (!stripePromiseCache) {
    stripePromiseCache = loadStripe(
      stripeKey,
      medusaAccountId ? { stripeAccount: medusaAccountId } : undefined
    )
  }
  return stripePromiseCache
}

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ cart, children }) => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)

  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const needsStripe = isStripeLike(paymentSession?.provider_id) && paymentSession

  // 仅在需要 Stripe 时才加载，减少不必要的 JS 解析
  useEffect(() => {
    if (needsStripe && !stripePromise) {
      setStripePromise(getStripePromise())
    }
  }, [needsStripe, stripePromise])

  if (needsStripe && stripePromise) {
    return (
      <StripeWrapper
        paymentSession={paymentSession}
        stripeKey={stripeKey}
        stripePromise={stripePromise}
      >
        {children}
      </StripeWrapper>
    )
  }

  return <div>{children}</div>
}

export default PaymentWrapper
