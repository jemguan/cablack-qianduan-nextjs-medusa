import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"

import Divider from "@modules/common/components/divider"

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
}

const ShippingDetails = ({ order }: ShippingDetailsProps) => {
  // 获取已发货的 fulfillments
  const shippedFulfillments = order.fulfillments?.filter(
    (fulfillment) => fulfillment.shipped_at !== null
  ) || []

  // 提取 tracking 信息
  const getTrackingInfo = (fulfillment: any) => {
    // 优先从 labels[0] 获取
    if (fulfillment.labels && fulfillment.labels.length > 0) {
      return {
        tracking_number: fulfillment.labels[0].tracking_number,
        tracking_url: fulfillment.labels[0].tracking_url,
      }
    }

    // 如果没有 labels，从 metadata 获取
    if (fulfillment.metadata) {
      return {
        tracking_number: fulfillment.metadata.tracking_number,
        tracking_url: fulfillment.metadata.tracking_url,
      }
    }

    // 如果还没有，从 data 字段获取
    if (fulfillment.data) {
      return {
        tracking_number: fulfillment.data.tracking_number,
        tracking_url: fulfillment.data.tracking_url,
      }
    }

    return null
  }

  return (
    <div>
      <Heading level="h2" className="flex flex-row text-3xl-regular my-6">
        Delivery
      </Heading>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-4 small:gap-x-8">
        <div
          className="flex flex-col w-[calc(50%-0.5rem)] small:w-1/3"
          data-testid="shipping-address-summary"
        >
          <Text className="txt-medium-plus text-ui-fg-base mb-1">
            Shipping Address
          </Text>
          <Text className="txt-medium text-ui-fg-subtle">
            {order.shipping_address?.first_name}{" "}
            {order.shipping_address?.last_name}
          </Text>
          <Text className="txt-medium text-ui-fg-subtle">
            {order.shipping_address?.address_1}{" "}
            {order.shipping_address?.address_2}
          </Text>
          <Text className="txt-medium text-ui-fg-subtle">
            {order.shipping_address?.postal_code},{" "}
            {order.shipping_address?.city}
          </Text>
          <Text className="txt-medium text-ui-fg-subtle">
            {order.shipping_address?.country_code?.toUpperCase()}
          </Text>
        </div>

        <div
          className="flex flex-col w-[calc(50%-0.5rem)] small:w-1/3"
          data-testid="shipping-contact-summary"
        >
          <Text className="txt-medium-plus text-ui-fg-base mb-1">Contact</Text>
          <Text className="txt-medium text-ui-fg-subtle">
            {order.shipping_address?.phone}
          </Text>
          <Text className="txt-medium text-ui-fg-subtle break-words break-all">{order.email}</Text>
        </div>
      </div>

      {/* 显示 Tracking 信息 */}
      {shippedFulfillments.length > 0 && (
        <div className="mt-6">
          <Text className="txt-medium-plus text-ui-fg-base mb-3">
            Tracking Information
          </Text>
          <div className="flex flex-col gap-3">
            {shippedFulfillments.map((fulfillment, index) => {
              const trackingInfo = getTrackingInfo(fulfillment)
              
              if (!trackingInfo) {
                return null
              }

              return (
                <div
                  key={fulfillment.id || index}
                  className="flex flex-col gap-1 p-3 bg-ui-bg-subtle rounded-md"
                  data-testid="tracking-info"
                >
                  {trackingInfo.tracking_url ? (
                    <a
                      href={trackingInfo.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="txt-medium text-ui-fg-interactive hover:text-ui-fg-interactive-hover underline"
                    >
                      {trackingInfo.tracking_number || "Track Package"}
                    </a>
                  ) : trackingInfo.tracking_number ? (
                    <Text className="txt-medium text-ui-fg-subtle">
                      Tracking Number: {trackingInfo.tracking_number}
                    </Text>
                  ) : null}
                  
                  {fulfillment.shipped_at && (
                    <Text className="txt-small text-ui-fg-muted">
                      Shipped on: {new Date(fulfillment.shipped_at).toLocaleDateString()}
                    </Text>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Divider className="mt-8" />
    </div>
  )
}

export default ShippingDetails
