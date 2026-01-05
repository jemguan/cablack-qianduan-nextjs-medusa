"use client"

import { setAddresses } from "@lib/data/cart"
import compareAddresses from "@lib/util/compare-addresses"
import { CheckCircleSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Button, Heading, Text, useToggleState } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import Spinner from "@modules/common/icons/spinner"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useCallback, useState } from "react"
import BillingAddress from "../billing_address"
import ShippingAddress from "../shipping-address"

const Addresses = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const shippingFormDataRef = useRef<Record<string, any>>({})
  const billingFormDataRef = useRef<Record<string, any>>({})
  const sameAsBillingRef = useRef<boolean>(true)

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  // 验证地址是否完整
  const isAddressComplete = useCallback((data: Record<string, any>, sameAsBilling: boolean): boolean => {
    const requiredShippingFields = [
      "shipping_address.first_name",
      "shipping_address.last_name",
      "shipping_address.address_1",
      "shipping_address.postal_code",
      "shipping_address.city",
      "shipping_address.country_code",
      "email",
    ]

    const requiredBillingFields = [
      "billing_address.first_name",
      "billing_address.last_name",
      "billing_address.address_1",
      "billing_address.postal_code",
      "billing_address.city",
      "billing_address.country_code",
    ]

    // 检查必填字段
    const shippingComplete = requiredShippingFields.every(
      (field) => data[field] && String(data[field]).trim() !== ""
    )

    if (!shippingComplete) return false

    // 如果账单地址与收货地址相同，只需要检查收货地址
    if (sameAsBilling) return true

    // 检查账单地址必填字段
    const billingComplete = requiredBillingFields.every(
      (field) => data[field] && String(data[field]).trim() !== ""
    )

    return billingComplete
  }, [])

  // 保存地址（手动触发）
  const saveAddresses = useCallback(async (data: Record<string, any>, sameAsBilling: boolean) => {
    if (!isAddressComplete(data, sameAsBilling)) {
      return
    }

    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      // 将数据转换为 FormData
      const formData = new FormData()
      
      // 添加收货地址字段
      formData.append("shipping_address.first_name", data["shipping_address.first_name"] || "")
      formData.append("shipping_address.last_name", data["shipping_address.last_name"] || "")
      formData.append("shipping_address.address_1", data["shipping_address.address_1"] || "")
      formData.append("shipping_address.company", data["shipping_address.company"] || "")
      formData.append("shipping_address.postal_code", data["shipping_address.postal_code"] || "")
      formData.append("shipping_address.city", data["shipping_address.city"] || "")
      formData.append("shipping_address.country_code", data["shipping_address.country_code"] || "")
      formData.append("shipping_address.province", data["shipping_address.province"] || "")
      formData.append("shipping_address.phone", data["shipping_address.phone"] || "")
      formData.append("email", data["email"] || "")

      // 添加账单地址
      if (sameAsBilling) {
        formData.append("same_as_billing", "on")
      } else {
        formData.append("billing_address.first_name", data["billing_address.first_name"] || "")
        formData.append("billing_address.last_name", data["billing_address.last_name"] || "")
        formData.append("billing_address.address_1", data["billing_address.address_1"] || "")
        formData.append("billing_address.company", data["billing_address.company"] || "")
        formData.append("billing_address.postal_code", data["billing_address.postal_code"] || "")
        formData.append("billing_address.city", data["billing_address.city"] || "")
        formData.append("billing_address.country_code", data["billing_address.country_code"] || "")
        formData.append("billing_address.province", data["billing_address.province"] || "")
        formData.append("billing_address.phone", data["billing_address.phone"] || "")
      }

      const error = await setAddresses(null, formData)
      
      if (error) {
        // 检查是否是变体错误（购物车中有无效商品）
        if (error.includes("do not exist") || error.includes("not published")) {
          // 刷新购物车以清理无效商品，然后重试
          router.refresh()
          // 延迟重试保存地址
          setTimeout(async () => {
            try {
              const retryError = await setAddresses(null, formData)
              if (retryError) {
                setSaveError("购物车中有无效商品，请刷新页面后重试")
              } else {
                setSaveError(null)
                setSaveSuccess(true)
                setTimeout(() => {
                  router.refresh()
                }, 500)
              }
            } catch (retryErr: any) {
              setSaveError("购物车中有无效商品，请刷新页面后重试")
            }
          }, 1000)
          return
        }
        setSaveError(error)
        setSaveSuccess(false)
      } else {
        setSaveError(null)
        setSaveSuccess(true)
        // 延迟刷新页面，让用户看到成功提示
        setTimeout(() => {
          router.refresh()
        }, 500)
      }
    } catch (error: any) {
      const errorMessage = error.message || "Failed to save address"
      // 检查是否是变体错误
      if (errorMessage.includes("do not exist") || errorMessage.includes("not published")) {
        setSaveError("购物车中有无效商品，请刷新页面后重试")
        // 刷新购物车
        router.refresh()
      } else {
        setSaveError(errorMessage)
      }
      setSaveSuccess(false)
    } finally {
      setIsSaving(false)
    }
  }, [isAddressComplete, router])

  // 更新 ref
  useEffect(() => {
    sameAsBillingRef.current = sameAsBilling
  }, [sameAsBilling])

  // 处理收货地址表单数据变化（只更新 ref，不自动保存）
  const handleShippingFormDataChange = useCallback((data: Record<string, any>) => {
    shippingFormDataRef.current = data
  }, [])

  // 处理账单地址表单数据变化（只更新 ref，不自动保存）
  const handleBillingFormDataChange = useCallback((data: Record<string, any>) => {
    billingFormDataRef.current = data
  }, [])

  // 手动确认并保存地址
  const handleConfirmAddress = useCallback(async () => {
    const mergedData = {
      ...shippingFormDataRef.current,
      ...billingFormDataRef.current,
    }
    
    if (!isAddressComplete(mergedData, sameAsBillingRef.current)) {
      setSaveError("请填写所有必填字段")
      return
    }

    await saveAddresses(mergedData, sameAsBillingRef.current)
  }, [saveAddresses, isAddressComplete])

  // 初始化表单数据 ref（从 cart 中读取）
  useEffect(() => {
    if (cart) {
      // 初始化 shipping 地址数据
      shippingFormDataRef.current = {
        "shipping_address.first_name": cart.shipping_address?.first_name || "",
        "shipping_address.last_name": cart.shipping_address?.last_name || "",
        "shipping_address.address_1": cart.shipping_address?.address_1 || "",
        "shipping_address.company": cart.shipping_address?.company || "",
        "shipping_address.postal_code": cart.shipping_address?.postal_code || "",
        "shipping_address.city": cart.shipping_address?.city || "",
        "shipping_address.country_code": cart.shipping_address?.country_code || "",
        "shipping_address.province": cart.shipping_address?.province || "",
        "shipping_address.phone": cart.shipping_address?.phone || "",
        email: cart.email || "",
      }

      // 初始化 billing 地址数据
      billingFormDataRef.current = {
        "billing_address.first_name": cart.billing_address?.first_name || "",
        "billing_address.last_name": cart.billing_address?.last_name || "",
        "billing_address.address_1": cart.billing_address?.address_1 || "",
        "billing_address.company": cart.billing_address?.company || "",
        "billing_address.postal_code": cart.billing_address?.postal_code || "",
        "billing_address.city": cart.billing_address?.city || "",
        "billing_address.country_code": cart.billing_address?.country_code || "",
        "billing_address.province": cart.billing_address?.province || "",
        "billing_address.phone": cart.billing_address?.phone || "",
      }
    }
  }, [cart])


  const hasAddress = cart?.shipping_address && cart?.billing_address

  return (
    <div className="bg-card">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className="flex flex-row text-3xl-regular gap-x-2 items-baseline"
        >
          Shipping Address
          {hasAddress && <CheckCircleSolid />}
        </Heading>
      </div>
      {hasAddress ? (
        <div>
          <div className="text-small-regular">
            <div className="flex items-start gap-x-8">
              <div className="flex items-start gap-x-1 w-full">
                <div
                  className="flex flex-col w-1/3"
                  data-testid="shipping-address-summary"
                >
                  <Text className="txt-medium-plus text-ui-fg-base mb-1">
                    Shipping Address
                  </Text>
                  <Text className="txt-medium text-ui-fg-subtle">
                    {cart.shipping_address.first_name}{" "}
                    {cart.shipping_address.last_name}
                  </Text>
                  <Text className="txt-medium text-ui-fg-subtle">
                    {cart.shipping_address.address_1}{" "}
                    {cart.shipping_address.address_2}
                  </Text>
                  <Text className="txt-medium text-ui-fg-subtle">
                    {cart.shipping_address.postal_code},{" "}
                    {cart.shipping_address.city}
                  </Text>
                  <Text className="txt-medium text-ui-fg-subtle">
                    {cart.shipping_address.country_code?.toUpperCase()}
                  </Text>
                </div>

                <div
                  className="flex flex-col w-1/3 "
                  data-testid="shipping-contact-summary"
                >
                  <Text className="txt-medium-plus text-ui-fg-base mb-1">
                    Contact
                  </Text>
                  <Text className="txt-medium text-ui-fg-subtle">
                    {cart.shipping_address.phone}
                  </Text>
                  <Text className="txt-medium text-ui-fg-subtle">
                    {cart.email}
                  </Text>
                </div>

                <div
                  className="flex flex-col w-1/3"
                  data-testid="billing-address-summary"
                >
                  <Text className="txt-medium-plus text-ui-fg-base mb-1">
                    Billing Address
                  </Text>

                  {sameAsBilling ? (
                    <Text className="txt-medium text-ui-fg-subtle">
                      Billing and delivery address are the same.
                    </Text>
                  ) : (
                    <>
                      <Text className="txt-medium text-ui-fg-subtle">
                        {cart.billing_address?.first_name}{" "}
                        {cart.billing_address?.last_name}
                      </Text>
                      <Text className="txt-medium text-ui-fg-subtle">
                        {cart.billing_address?.address_1}{" "}
                        {cart.billing_address?.address_2}
                      </Text>
                      <Text className="txt-medium text-ui-fg-subtle">
                        {cart.billing_address?.postal_code},{" "}
                        {cart.billing_address?.city}
                      </Text>
                      <Text className="txt-medium text-ui-fg-subtle">
                        {cart.billing_address?.country_code?.toUpperCase()}
                      </Text>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="pb-8">
              <ShippingAddress
                customer={customer}
                checked={sameAsBilling}
                onChange={toggleSameAsBilling}
                cart={cart}
                onFormDataChange={handleShippingFormDataChange}
              />

              {!sameAsBilling && (
                <div>
                  <Heading
                    level="h2"
                    className="text-3xl-regular gap-x-4 pb-6 pt-8"
                  >
                    Billing address
                  </Heading>

                  <BillingAddress cart={cart} onFormDataChange={handleBillingFormDataChange} />
                </div>
              )}
              
              {/* 确认按钮和保存状态指示器 */}
              <div className="mt-6 flex flex-col gap-4">
                <Button
                  onClick={handleConfirmAddress}
                  isLoading={isSaving}
                  disabled={isSaving}
                  variant="primary"
                  className="w-full sm:w-auto"
                  data-testid="confirm-address-button"
                >
                  Confirm Address
                </Button>
                
                <div className="flex items-center gap-2">
                  {isSaving && (
                    <>
                      <Spinner className="animate-spin" />
                      <Text className="text-small-regular text-ui-fg-subtle">
                        Saving address...
                      </Text>
                    </>
                  )}
                  {saveSuccess && !isSaving && (
                    <Text className="text-small-regular text-green-600 flex items-center gap-2">
                      <CheckCircleSolid className="w-4 h-4" />
                      Address saved successfully
                    </Text>
                  )}
                  {saveError && !isSaving && (
                    <Text className="text-small-regular text-red-600">
                      {saveError}
                    </Text>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="pb-8">
            <ShippingAddress
              customer={customer}
              checked={sameAsBilling}
              onChange={toggleSameAsBilling}
              cart={cart}
              onFormDataChange={handleShippingFormDataChange}
            />

            {!sameAsBilling && (
              <div>
                <Heading
                  level="h2"
                  className="text-3xl-regular gap-x-4 pb-6 pt-8"
                >
                  Billing address
                </Heading>

                <BillingAddress cart={cart} onFormDataChange={handleBillingFormDataChange} />
              </div>
            )}
            
            {/* 确认按钮和保存状态指示器 */}
            <div className="mt-6 flex flex-col gap-4">
              <Button
                onClick={handleConfirmAddress}
                isLoading={isSaving}
                disabled={isSaving}
                variant="primary"
                className="w-full sm:w-auto"
                data-testid="confirm-address-button"
              >
                Confirm Address
              </Button>
              
              <div className="flex items-center gap-2">
                {isSaving && (
                  <>
                    <Spinner className="animate-spin" />
                    <Text className="text-small-regular text-ui-fg-subtle">
                      Saving address...
                    </Text>
                  </>
                )}
                {saveSuccess && !isSaving && (
                  <Text className="text-small-regular text-green-600 flex items-center gap-2">
                    <CheckCircleSolid className="w-4 h-4" />
                    Address saved successfully
                  </Text>
                )}
                {saveError && !isSaving && (
                  <Text className="text-small-regular text-red-600">
                    {saveError}
                  </Text>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <Divider className="mt-8" />
    </div>
  )
}

export default Addresses
