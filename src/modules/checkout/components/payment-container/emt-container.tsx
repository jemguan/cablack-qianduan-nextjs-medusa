import { Text } from "@medusajs/ui"
import { CreditCard } from "@medusajs/icons"
import React from "react"
import PaymentContainer, { PaymentContainerProps } from "./index"

type EmtContainerProps = Omit<PaymentContainerProps, "children"> & {
  paymentSession?: any
}

const EmtContainer: React.FC<EmtContainerProps> = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  paymentSession,
}) => {
  const emtData = paymentSession?.data as
    | {
        name?: string
        description?: string | null
        emails?: string[]
      }
    | undefined

  const displayName = emtData?.name || paymentInfoMap[paymentProviderId]?.title || paymentProviderId
  const description = emtData?.description
  const emails = emtData?.emails || []

  // Create a modified paymentInfoMap with the EMT name if available
  const modifiedPaymentInfoMap = emtData?.name
    ? {
        ...paymentInfoMap,
        [paymentProviderId]: {
          ...(paymentInfoMap[paymentProviderId] || { icon: <CreditCard /> }),
          title: emtData.name,
        },
      }
    : paymentInfoMap

  return (
    <PaymentContainer
      paymentProviderId={paymentProviderId}
      selectedPaymentOptionId={selectedPaymentOptionId}
      paymentInfoMap={modifiedPaymentInfoMap}
      disabled={disabled}
    >
      {selectedPaymentOptionId === paymentProviderId && (
        <div className="my-4 transition-all duration-150 ease-in-out space-y-3">
          {description && (
            <div>
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment Instructions:
              </Text>
              <Text className="txt-medium text-ui-fg-subtle">
                {description}
              </Text>
            </div>
          )}
          {emails.length > 0 && (
            <div>
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Receiving Email:
              </Text>
              <div className="space-y-1">
                {emails.map((email: string, index: number) => (
                  <Text
                    key={index}
                    className="txt-medium text-ui-fg-subtle font-mono"
                  >
                    {email}
                  </Text>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PaymentContainer>
  )
}

export default EmtContainer

