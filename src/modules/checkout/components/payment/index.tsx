"use client"

import { RadioGroup } from "@headlessui/react"
import { isStripeLike, isEmt, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import { Heading, Text } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentButton from "@modules/checkout/components/payment-button"
import PaymentContainer, {
  StripePaymentContainer,
  EmtContainer,
} from "@modules/checkout/components/payment-container"
import Divider from "@modules/common/components/divider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: any
  availablePaymentMethods: any[]
}) => {
  // First find any pending payment session
  const pendingSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stripePaymentComplete, setStripePaymentComplete] = useState(false)
  
  // 初始化时，如果有 pending 的支付会话，自动设置选中的支付方式
  const initialPaymentMethod = pendingSession?.provider_id || ""
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(initialPaymentMethod)

  // Now we can use selectedPaymentMethod to find the active session
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => 
      paymentSession.status === "pending" && 
      paymentSession.provider_id === selectedPaymentMethod
  ) || pendingSession

  const router = useRouter()

  // 当购物车数据更新时（例如刷新后），检查是否有新的支付会话并更新选中状态
  useEffect(() => {
    if (pendingSession?.provider_id) {
      // 使用函数式更新，避免依赖 selectedPaymentMethod
      setSelectedPaymentMethod((current: string) => {
        // 如果当前没有选中，或者 pendingSession 的 provider_id 与当前选中不同，则更新
        if (!current || pendingSession.provider_id !== current) {
          return pendingSession.provider_id
        }
        return current
      })
    }
  }, [pendingSession?.provider_id, pendingSession?.status])

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)
    // 切换支付方式时重置 Stripe 支付完成状态
    setStripePaymentComplete(false)
    if (isStripeLike(method) || isEmt(method)) {
      setIsLoading(true)
      try {
        if (!cart?.id) {
          throw new Error("Cart not found. Please refresh the page and try again.")
        }
        
        if (!cart?.region_id) {
          throw new Error("Cart region not found. Please refresh the page and try again.")
        }
        
        // Pass only cart.id to avoid serialization issues in server action
        await initiatePaymentSession(cart.id, {
          provider_id: method,
        })
        
        // Refresh the page to get updated cart data with payment session
        router.refresh()
      } catch (err: any) {
        // 提取更友好的错误信息
        let errorMessage = "Failed to initialize payment session"
        
        if (err?.message) {
          errorMessage = err.message
          // 处理常见的服务器错误
          if (err.message.includes("500") || err.message.includes("Internal Server Error")) {
            errorMessage = "Payment service is temporarily unavailable. Please try again in a moment or contact support."
          } else if (err.message.includes("No such customer") || err.message.includes("customer") || err.message.includes("Payment account error")) {
            errorMessage = "Payment account error detected. Please refresh the page and try again. If the problem persists, please contact support."
          } else if (err.message.includes("401") || err.message.includes("Unauthorized")) {
            errorMessage = "Authentication failed. Please refresh the page and try again."
          } else if (err.message.includes("404") || err.message.includes("Not Found")) {
            errorMessage = "Payment method not found. Please refresh the page and try again."
          } else if (err.message.includes("Cart not found")) {
            errorMessage = "Your cart session has expired. Please refresh the page."
          } else if (err.message.includes("region")) {
            errorMessage = "Region configuration error. Please refresh the page and try again."
          }
        } else if (err?.response?.data?.message) {
          errorMessage = err.response.data.message
        } else if (typeof err === "string") {
          errorMessage = err
        }
        
        setError(errorMessage)
        // Reset selection on error - 清空选择，让用户重新选择
        setSelectedPaymentMethod("")
      } finally {
        setIsLoading(false)
      }
    }
  }

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  // 对于 Stripe 支付，需要确保表单已完成
  const isStripePayment = isStripeLike(selectedPaymentMethod)
  const paymentReady =
    (activeSession && 
     cart?.shipping_methods.length !== 0 && 
     (!isStripePayment || stripePaymentComplete)) || 
    paidByGiftcard

  useEffect(() => {
    setError(null)
  }, [selectedPaymentMethod])

  return (
    <div className="bg-card">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className="flex flex-row text-3xl-regular gap-x-2 items-baseline"
        >
          Payment
          {paymentReady && <CheckCircleSolid />}
        </Heading>
      </div>
      <div>
        {!paidByGiftcard && availablePaymentMethods?.length && (
          <>
            <RadioGroup
              value={selectedPaymentMethod}
              onChange={(value: string) => setPaymentMethod(value)}
            >
              {availablePaymentMethods.map((paymentMethod) => {
                // Find payment session for this specific payment method
                const paymentSession = cart.payment_collection?.payment_sessions?.find(
                  (ps: any) => ps.provider_id === paymentMethod.id && ps.status === "pending"
                )
                
                // For EMT payment, also check activeSession if it matches
                const emtPaymentSession = isEmt(paymentMethod.id) && activeSession?.provider_id === paymentMethod.id
                  ? activeSession
                  : paymentSession
                
                return (
                  <div key={paymentMethod.id}>
                    {isStripeLike(paymentMethod.id) ? (
                      <StripePaymentContainer
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                        paymentInfoMap={paymentInfoMap}
                        setError={setError}
                        setPaymentReady={setStripePaymentComplete}
                      />
                    ) : isEmt(paymentMethod.id) ? (
                      <EmtContainer
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                        paymentInfoMap={paymentInfoMap}
                        paymentSession={emtPaymentSession}
                      />
                    ) : (
                      <PaymentContainer
                        paymentInfoMap={paymentInfoMap}
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                      />
                    )}
                  </div>
                )
              })}
            </RadioGroup>
          </>
        )}

        {paidByGiftcard && (
          <div className="flex flex-col w-1/3">
            <Text className="txt-medium-plus text-ui-fg-base mb-1">
              Payment method
            </Text>
            <Text
              className="txt-medium text-ui-fg-subtle"
              data-testid="payment-method-summary"
            >
              Gift card
            </Text>
          </div>
        )}

        <ErrorMessage
          error={error}
          data-testid="payment-method-error-message"
        />

        {/* 支付按钮 */}
        {paymentReady && (
          <div className="mt-8">
            <PaymentButton cart={cart} data-testid="submit-order-button" />
          </div>
        )}
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment
