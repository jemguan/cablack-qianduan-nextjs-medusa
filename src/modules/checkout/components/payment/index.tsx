"use client"

import { RadioGroup } from "@headlessui/react"
import { isStripeLike, isEmt, isManual, paymentInfoMap } from "@lib/constants"
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
import { useEffect, useState, useRef } from "react"

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

  // 检测是否为零金额订单
  const isZeroTotal = cart?.total === 0
  
  // 使用 ref 防止重复调用初始化 Manual Payment
  const zeroTotalInitialized = useRef(false)

  // 当 total 为 0 时，自动初始化 Manual Payment Session（pp_system_default）
  useEffect(() => {
    // 如果 total 为 0 且还没有 activeSession，自动初始化 Manual Payment
    if (isZeroTotal && !activeSession && !zeroTotalInitialized.current) {
      const manualProvider = availablePaymentMethods?.find(
        (pm) => isManual(pm.id)
      )
      if (manualProvider) {
        zeroTotalInitialized.current = true
        // 自动初始化 Manual Payment Session
        setIsLoading(true)
        setError(null)
        initiatePaymentSession(cart.id, {
          provider_id: manualProvider.id,
        })
          .then(() => {
            setSelectedPaymentMethod(manualProvider.id)
            router.refresh()
          })
          .catch((err: any) => {
            setError(err?.message || "Failed to initialize payment for zero total order")
            zeroTotalInitialized.current = false
          })
          .finally(() => {
            setIsLoading(false)
          })
      } else {
        // 没有配置 Manual Payment Provider
        setError("No payment method available for zero total orders. Please contact support.")
      }
    }
  }, [isZeroTotal, activeSession, availablePaymentMethods, cart?.id, router])

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

  // 当购物车不为0时，如果当前选中的是 Manual Payment，自动取消选择
  useEffect(() => {
    const hasCartItems = cart?.items?.length > 0
    if (hasCartItems && isManual(selectedPaymentMethod)) {
      setSelectedPaymentMethod("")
      setError(null)
    }
  }, [cart?.items?.length, selectedPaymentMethod])

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
  
  // 零金额订单可以直接下单（只要有 activeSession 或正在初始化中）
  const zeroTotalReady = isZeroTotal && activeSession && cart?.shipping_methods?.length !== 0
  
  const paymentReady =
    zeroTotalReady ||
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
        {/* 零金额订单：显示简化 UI */}
        {isZeroTotal && !paidByGiftcard && (
          <div className="flex flex-col w-full mb-4">
            <div className="flex items-center gap-x-2 p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
              <CheckCircleSolid className="text-ui-fg-interactive" />
              <div>
                <Text className="txt-medium-plus text-ui-fg-base">
                  No payment required
                </Text>
                <Text className="txt-small text-ui-fg-subtle">
                  Your order total is $0.00. You can place your order without payment.
                </Text>
              </div>
            </div>
            {isLoading && (
              <Text className="txt-small text-ui-fg-subtle mt-2">
                Preparing your order...
              </Text>
            )}
          </div>
        )}

        {/* 正常支付流程：显示支付方式选择 */}
        {!isZeroTotal && !paidByGiftcard && availablePaymentMethods?.length && (
          <>
            <RadioGroup
              value={selectedPaymentMethod}
              onChange={(value: string) => setPaymentMethod(value)}
            >
              {availablePaymentMethods
                .filter((paymentMethod) => {
                  // 当购物车不为0时，隐藏 Manual Payment 选项
                  const hasCartItems = cart?.items?.length > 0
                  if (hasCartItems && isManual(paymentMethod.id)) {
                    return false
                  }
                  return true
                })
                .map((paymentMethod) => {
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
