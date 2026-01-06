"use client"

import { loadStripe } from "@stripe/stripe-js"
import React from "react"
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
const stripePromise = stripeKey
  ? loadStripe(
      stripeKey,
      medusaAccountId ? { stripeAccount: medusaAccountId } : undefined
    )
  : null

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ cart, children }) => {
  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  // 调试日志（仅在开发环境或生产环境有错误时）
  if (process.env.NODE_ENV === "development" || !stripePromise || !paymentSession) {
    console.log("[PaymentWrapper] Debug info:", {
      hasStripeKey: !!stripeKey,
      stripeKeyPrefix: stripeKey?.substring(0, 10) + "...",
      hasStripePromise: !!stripePromise,
      paymentSessions: cart.payment_collection?.payment_sessions?.map(s => ({
        provider_id: s.provider_id,
        status: s.status,
        hasClientSecret: !!s.data?.client_secret
      })),
      selectedPaymentSession: paymentSession ? {
        provider_id: paymentSession.provider_id,
        status: paymentSession.status,
        isStripeLike: isStripeLike(paymentSession.provider_id),
        hasClientSecret: !!paymentSession.data?.client_secret
      } : null
    })
  }

  if (
    isStripeLike(paymentSession?.provider_id) &&
    paymentSession &&
    stripePromise
  ) {
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
