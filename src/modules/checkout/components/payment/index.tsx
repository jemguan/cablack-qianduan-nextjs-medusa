"use client"

import { RadioGroup } from "@headlessui/react"
import { isStripeLike, isEmt, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import { Button, Container, Heading, Text, clx } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer, {
  StripePaymentContainer,
  EmtContainer,
} from "@modules/checkout/components/payment-container"
import Divider from "@modules/common/components/divider"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

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

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)
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

  const paymentReady =
    (activeSession && cart?.shipping_methods.length !== 0) || paidByGiftcard

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const shouldInputCard =
        isStripeLike(selectedPaymentMethod) && !activeSession

      const checkActiveSession =
        activeSession?.provider_id === selectedPaymentMethod

      if (!checkActiveSession) {
        await initiatePaymentSession(cart.id, {
          provider_id: selectedPaymentMethod,
        })
      }

      if (!shouldInputCard) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          {
            scroll: false,
          }
        )
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

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
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          Payment
          {!isOpen && paymentReady && <CheckCircleSolid />}
        </Heading>
        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="edit-payment-button"
            >
              Edit
            </button>
          </Text>
        )}
      </div>
      <div>
        <div className={isOpen ? "block" : "hidden"}>
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

          <Button
            size="large"
            className="mt-6"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={
              (isStripeLike(selectedPaymentMethod) && !stripePaymentComplete) ||
              (!selectedPaymentMethod && !paidByGiftcard)
            }
            data-testid="submit-payment-button"
          >
            {!activeSession && isStripeLike(selectedPaymentMethod)
              ? "Enter payment details"
              : "Continue to review"}
          </Button>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <div className="flex items-start gap-x-1 w-full">
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Payment method
                </Text>
                <Text
                  className="txt-medium text-ui-fg-subtle"
                  data-testid="payment-method-summary"
                >
                  {isEmt(activeSession?.provider_id) && activeSession?.data?.name
                    ? (activeSession.data as any).name
                    : paymentInfoMap[activeSession?.provider_id]?.title ||
                      activeSession?.provider_id}
                </Text>
              </div>
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Payment details
                </Text>
                {isEmt(activeSession?.provider_id) ? (
                  <div className="space-y-2">
                    {(activeSession?.data as any)?.description && (
                      <Text className="txt-medium text-ui-fg-subtle">
                        {(activeSession.data as any).description}
                      </Text>
                    )}
                    {(activeSession?.data as any)?.emails &&
                      Array.isArray((activeSession.data as any).emails) &&
                      (activeSession.data as any).emails.length > 0 && (
                        <div className="space-y-1">
                          <Text className="txt-small text-ui-fg-muted">
                            Receiving Email:
                          </Text>
                          {(activeSession.data as any).emails.map(
                            (email: string, index: number) => (
                              <Text
                                key={index}
                                className="txt-medium text-ui-fg-subtle font-mono"
                              >
                                {email}
                              </Text>
                            )
                          )}
                        </div>
                      )}
                  </div>
                ) : (
                  <div
                    className="flex gap-2 txt-medium text-ui-fg-subtle items-center"
                    data-testid="payment-details-summary"
                  >
                    <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                      {paymentInfoMap[selectedPaymentMethod]?.icon || (
                        <CreditCard />
                      )}
                    </Container>
                    <Text>
                      {isStripeLike(selectedPaymentMethod)
                        ? "Payment method selected"
                        : "Another step will appear"}
                    </Text>
                  </div>
                )}
              </div>
            </div>
          ) : paidByGiftcard ? (
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
          ) : null}
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment
