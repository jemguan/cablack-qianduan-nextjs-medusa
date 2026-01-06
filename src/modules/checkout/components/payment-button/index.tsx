"use client"

import { isManual, isStripeLike, isEmt } from "@lib/constants"
import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import { useRouter } from "next/navigation"
import React, { useState } from "react"
import ErrorMessage from "../error-message"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]

  switch (true) {
    case isStripeLike(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isManual(paymentSession?.provider_id):
      return (
        <ManualTestPaymentButton notReady={notReady} data-testid={dataTestId} />
      )
    case isEmt(paymentSession?.provider_id):
      return (
        <EmtPaymentButton notReady={notReady} data-testid={dataTestId} />
      )
    default:
      return <Button disabled>Select a payment method</Button>
  }
}

const StripePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    try {
      // 等待更长时间，确保支付状态已同步到后端
      // Stripe webhook 可能需要时间处理
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 最多重试 3 次
      let lastError: any = null
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const result = await placeOrder()
          // If placeOrder returns an order, redirect manually
          if (result && typeof result === 'object' && 'type' in result && result.type === 'order' && result.order?.id) {
            router.push(result.redirectUrl || `/order/${result.order.id}/confirmed`)
            return
          }
          // 如果没有订单，可能是其他问题
          break
        } catch (err: any) {
          lastError = err
          // 如果是支付会话未授权错误，等待后重试
          if (err?.message?.includes("Payment session") || err?.message?.includes("not authorized")) {
            if (attempt < 2) {
              // 等待更长时间后重试
              await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
              continue
            }
          }
          // 其他错误直接抛出
          throw err
        }
      }
      
      // 如果所有重试都失败
      if (lastError) {
        throw lastError
      }
    } catch (err: any) {
      // 提供更友好的错误信息
      let errorMsg = err?.message || "Failed to place order"
      
      if (errorMsg.includes("shipping method") || errorMsg.includes("shipping profiles")) {
        errorMsg = "Shipping method issue detected. Please refresh the page and try again, or select a different shipping method."
      } else if (errorMsg.includes("not authorized") || errorMsg.includes("Payment session") || errorMsg.includes("Payment verification")) {
        errorMsg = "Payment verification is taking longer than expected. Please wait a moment and refresh the page, or contact support if the issue persists."
      } else if (errorMsg.includes("Could not delete all payment sessions")) {
        // 这个错误通常不影响订单，但用户可能需要刷新页面查看订单状态
        errorMsg = "Order may have been created successfully. Please check your order history or refresh the page."
      }
      
      setErrorMessage(errorMsg)
      setSubmitting(false)
    }
  }

  const stripe = useStripe()
  const elements = useElements()

  const disabled = !stripe || !elements ? true : false

  const handlePayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    if (!stripe || !elements || !cart) {
      setSubmitting(false)
      return
    }

    // Use confirmPayment with Payment Element
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order/confirmed`,
        payment_method_data: {
          billing_details: {
            name:
              cart.billing_address?.first_name +
              " " +
              cart.billing_address?.last_name,
            address: {
              city: cart.billing_address?.city ?? undefined,
              country: cart.billing_address?.country_code ?? undefined,
              line1: cart.billing_address?.address_1 ?? undefined,
              line2: cart.billing_address?.address_2 ?? undefined,
              postal_code: cart.billing_address?.postal_code ?? undefined,
              state: cart.billing_address?.province ?? undefined,
            },
            email: cart.email ?? undefined,
            phone: cart.billing_address?.phone ?? undefined,
          },
        },
      },
      redirect: "if_required",
      })

        if (error) {
          const pi = error.payment_intent

          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            // 支付已成功，但 Stripe 返回了错误（可能是其他原因）
            // 继续完成订单流程
            onPaymentCompleted()
            return
          }

          // 如果是支付相关的错误，显示友好信息
          let errorMsg = error.message || "Payment failed"
          if (error.type === "card_error" || error.type === "validation_error") {
            errorMsg = error.message || "Payment information is invalid. Please check your details and try again."
          }
          
          setErrorMessage(errorMsg)
          setSubmitting(false)
          return
        }

        if (
      paymentIntent &&
      (paymentIntent.status === "requires_capture" ||
        paymentIntent.status === "succeeded")
        ) {
      onPaymentCompleted()
      return
        }

    setSubmitting(false)
  }

  return (
    <>
      <Button
        disabled={disabled || notReady}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        variant="primary"
        className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white border-none !border-2 !border-orange-600 hover:!border-orange-700 dark:!border-orange-600 dark:hover:!border-orange-700 disabled:!border-ui-border-base !shadow-none"
        style={{ borderColor: 'rgb(234 88 12)', borderWidth: '2px', borderStyle: 'solid' }}
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

const ManualTestPaymentButton = ({ notReady, "data-testid": dataTestId }: { notReady: boolean; "data-testid"?: string }) => {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    try {
      const result = await placeOrder()
      // If placeOrder returns an order, redirect manually
      if (result && typeof result === 'object' && 'type' in result && result.type === 'order' && result.order?.id) {
        router.push(result.redirectUrl || `/order/${result.order.id}/confirmed`)
        return
      }
    } catch (err: any) {
      // 提供更友好的错误信息
      let errorMsg = err?.message || "Failed to place order"
      
      if (errorMsg.includes("shipping method") || errorMsg.includes("shipping profiles")) {
        errorMsg = "Shipping method issue detected. Please refresh the page and try again, or select a different shipping method."
      } else if (errorMsg.includes("not authorized") || errorMsg.includes("Payment session")) {
        errorMsg = "Payment verification failed. Please try again or contact support if the issue persists."
      }
      
      setErrorMessage(errorMsg)
      setSubmitting(false)
    }
  }

  const handlePayment = () => {
    setSubmitting(true)

    onPaymentCompleted()
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        variant="primary"
        className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white border-none !border-2 !border-orange-600 hover:!border-orange-700 dark:!border-orange-600 dark:hover:!border-orange-700 disabled:!border-ui-border-base !shadow-none"
        style={{ borderColor: 'rgb(234 88 12)', borderWidth: '2px', borderStyle: 'solid' }}
        data-testid="submit-order-button"
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}

const EmtPaymentButton = ({ notReady, "data-testid": dataTestId }: { notReady: boolean; "data-testid"?: string }) => {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    try {
      const result = await placeOrder()
      // If placeOrder returns an order, redirect manually
      if (result && typeof result === 'object' && 'type' in result && result.type === 'order' && result.order?.id) {
        router.push(result.redirectUrl || `/order/${result.order.id}/confirmed`)
        return
      }
    } catch (err: any) {
      // 提供更友好的错误信息
      let errorMsg = err?.message || "Failed to place order"
      
      if (errorMsg.includes("shipping method") || errorMsg.includes("shipping profiles")) {
        errorMsg = "Shipping method issue detected. Please refresh the page and try again, or select a different shipping method."
      } else if (errorMsg.includes("not authorized") || errorMsg.includes("Payment session")) {
        errorMsg = "Payment verification failed. Please try again or contact support if the issue persists."
      }
      
      setErrorMessage(errorMsg)
      setSubmitting(false)
    }
  }

  const handlePayment = () => {
    setSubmitting(true)

    onPaymentCompleted()
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        variant="primary"
        className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white border-none !border-2 !border-orange-600 hover:!border-orange-700 dark:!border-orange-600 dark:hover:!border-orange-700 disabled:!border-ui-border-base !shadow-none"
        style={{ borderColor: 'rgb(234 88 12)', borderWidth: '2px', borderStyle: 'solid' }}
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="emt-payment-error-message"
      />
    </>
  )
}

export default PaymentButton
