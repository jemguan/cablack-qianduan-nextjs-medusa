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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    pendingSession?.provider_id ?? ""
  )

  // Now we can use selectedPaymentMethod to find the active session
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => 
      paymentSession.status === "pending" && 
      paymentSession.provider_id === selectedPaymentMethod
  ) || pendingSession

  const router = useRouter()

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)
    // 切换支付方式时重置 Stripe 支付完成状态
    setStripePaymentComplete(false)
    if (isStripeLike(method) || isEmt(method)) {
      setIsLoading(true)
      try {
        if (!cart?.id) {
          throw new Error("Cart not found")
        }
        
        if (!cart?.region_id) {
          throw new Error("Cart region not found")
        }
        
        console.log("Initiating payment session for:", method, "Cart ID:", cart.id)
        
        // Pass only cart.id to avoid serialization issues in server action
        const result = await initiatePaymentSession(cart.id, {
          provider_id: method,
        })
        
        console.log("Payment session initiated successfully:", result)
        
        // Refresh the page to get updated cart data with payment session
        router.refresh()
      } catch (err: any) {
        console.error("Error initiating payment session:", err)
        console.error("Error details:", {
          message: err.message,
          stack: err.stack,
          cart: cart?.id,
          method: method,
        })
        setError(err.message || "Failed to initialize payment session")
        // Reset selection on error
        setSelectedPaymentMethod(activeSession?.provider_id ?? "")
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

  // Update selected payment method when activeSession changes, but only if no method is currently selected
  useEffect(() => {
    if (activeSession?.provider_id && !selectedPaymentMethod) {
      setSelectedPaymentMethod(activeSession.provider_id)
    }
  }, [activeSession?.provider_id, selectedPaymentMethod])

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

        {/* 支付按钮和条款说明 */}
        {paymentReady && (
          <div className="mt-8">
            <div className="flex items-start gap-x-1 w-full mb-6">
              <div className="w-full">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  By clicking the Place Order button, you confirm that you have
                  read, understand and accept our Terms of Use, Terms of Sale and
                  Returns Policy and acknowledge that you have read Medusa
                  Store&apos;s Privacy Policy.
                </Text>
              </div>
            </div>
            <PaymentButton cart={cart} data-testid="submit-order-button" />
          </div>
        )}
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment
