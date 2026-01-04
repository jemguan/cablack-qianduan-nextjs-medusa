import { Container, Heading, Text } from "@medusajs/ui"

import { isStripeLike, isEmt, paymentInfoMap } from "@lib/constants"
import Divider from "@modules/common/components/divider"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
}

// Helper to get Stripe payment details from payment data and order metadata
const getStripePaymentInfo = (
  paymentData: Record<string, unknown> | undefined,
  orderMetadata: Record<string, unknown> | undefined
) => {
  const metadata = orderMetadata as Record<string, any> | undefined
  const data = paymentData as Record<string, any> | undefined
  
  // 优先从 order.metadata 获取（由 subscriber 写入）
  const cardLast4 = metadata?.stripe_card_last4 || 
    data?.card_last4 || 
    data?.payment_method?.card?.last4 ||
    data?.charges?.data?.[0]?.payment_method_details?.card?.last4
    
  const cardBrand = metadata?.stripe_card_brand ||
    data?.card_brand ||
    data?.payment_method?.card?.brand ||
    data?.charges?.data?.[0]?.payment_method_details?.card?.brand
    
  const paymentIntentId = metadata?.stripe_payment_intent_id ||
    data?.id || 
    data?.payment_intent_id
  
  return {
    cardLast4,
    cardBrand: cardBrand ? cardBrand.charAt(0).toUpperCase() + cardBrand.slice(1) : null,
    paymentIntentId,
  }
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const payment = order.payment_collections?.[0].payments?.[0]
  const stripeInfo = isStripeLike(payment?.provider_id) 
    ? getStripePaymentInfo(
        payment?.data as Record<string, unknown>,
        order.metadata as Record<string, unknown>
      ) 
    : null

  return (
    <div>
      <Heading level="h2" className="flex flex-row text-3xl-regular my-6">
        Payment
      </Heading>
      <div>
        {payment && (
          <div className="flex items-start gap-x-1 w-full">
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment method
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method"
              >
                {paymentInfoMap[payment.provider_id]?.title || payment.provider_id}
              </Text>
            </div>
            <div className="flex flex-col w-2/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment details
              </Text>
              
              {/* Stripe payment details */}
              {isStripeLike(payment.provider_id) && stripeInfo && (
                <div className="space-y-2">
                  <div className="flex gap-2 txt-medium text-ui-fg-subtle items-center">
                    <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                      {paymentInfoMap[payment.provider_id]?.icon}
                    </Container>
                    <Text data-testid="payment-card">
                      {stripeInfo.cardBrand && stripeInfo.cardLast4
                        ? `${stripeInfo.cardBrand} **** ${stripeInfo.cardLast4}`
                        : stripeInfo.cardLast4
                        ? `**** **** **** ${stripeInfo.cardLast4}`
                        : "Card payment"}
                    </Text>
                  </div>
                  <Text className="txt-small text-ui-fg-muted" data-testid="payment-amount">
                    {convertToLocale({
                      amount: payment.amount,
                      currency_code: order.currency_code,
                    })} paid at {new Date(payment.created_at ?? "").toLocaleString()}
                  </Text>
                  {stripeInfo.paymentIntentId && (
                    <Text className="txt-small text-ui-fg-muted font-mono" data-testid="payment-id">
                      Ref: {stripeInfo.paymentIntentId}
                    </Text>
                  )}
                </div>
              )}
              
              {/* EMT payment details */}
              {isEmt(payment.provider_id) && (
                <div className="space-y-2">
                  <div className="flex gap-2 txt-medium text-ui-fg-subtle items-center">
                    <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                      {paymentInfoMap[payment.provider_id]?.icon}
                    </Container>
                    <Text>
                      {(payment.data as any)?.name || "EMT Payment"}
                    </Text>
                  </div>
                  <Text className="txt-small text-ui-fg-muted" data-testid="payment-amount">
                    {convertToLocale({
                      amount: payment.amount,
                      currency_code: order.currency_code,
                    })} - {new Date(payment.created_at ?? "").toLocaleString()}
                  </Text>
                </div>
              )}
              
              {/* Default payment details */}
              {!isStripeLike(payment.provider_id) && !isEmt(payment.provider_id) && (
                <div className="flex gap-2 txt-medium text-ui-fg-subtle items-center">
                  <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                    {paymentInfoMap[payment.provider_id]?.icon}
                  </Container>
                  <Text data-testid="payment-amount">
                    {convertToLocale({
                      amount: payment.amount,
                      currency_code: order.currency_code,
                    })} paid at {new Date(payment.created_at ?? "").toLocaleString()}
                  </Text>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Divider className="mt-8" />
    </div>
  )
}

export default PaymentDetails
