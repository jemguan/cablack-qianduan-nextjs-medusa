/**
 * Addresses 模块工具函数
 */

import type { HttpTypes } from "@medusajs/types"
import type { AddressFormData } from "./types"
import {
  REQUIRED_SHIPPING_FIELDS,
  REQUIRED_BILLING_FIELDS,
  SHIPPING_ADDRESS_FIELDS,
  BILLING_ADDRESS_FIELDS,
} from "./types"

/**
 * 验证地址是否完整
 */
export function isAddressComplete(
  data: AddressFormData,
  sameAsBilling: boolean
): boolean {
  // 检查收货地址必填字段
  const shippingComplete = REQUIRED_SHIPPING_FIELDS.every(
    (field) => data[field] && String(data[field]).trim() !== ""
  )

  if (!shippingComplete) return false

  // 如果账单地址与收货地址相同，只需要检查收货地址
  if (sameAsBilling) return true

  // 检查账单地址必填字段
  const billingComplete = REQUIRED_BILLING_FIELDS.every(
    (field) => data[field] && String(data[field]).trim() !== ""
  )

  return billingComplete
}

/**
 * 验证收货地址电话是否填写
 */
export function validateShippingPhone(data: AddressFormData): string | null {
  if (
    !data["shipping_address.phone"] ||
    String(data["shipping_address.phone"]).trim() === ""
  ) {
    return "Please enter shipping address phone number (required)"
  }
  return null
}

/**
 * 验证账单地址电话是否填写
 */
export function validateBillingPhone(data: AddressFormData): string | null {
  if (
    !data["billing_address.phone"] ||
    String(data["billing_address.phone"]).trim() === ""
  ) {
    return "Please enter billing address phone number (required)"
  }
  return null
}

/**
 * 构建保存地址的 FormData
 */
export function buildAddressFormData(
  data: AddressFormData,
  sameAsBilling: boolean
): FormData {
  const formData = new FormData()

  // 添加收货地址字段
  SHIPPING_ADDRESS_FIELDS.forEach((field) => {
    formData.append(field, data[field] || "")
  })

  // 添加账单地址
  if (sameAsBilling) {
    formData.append("same_as_billing", "on")
  } else {
    BILLING_ADDRESS_FIELDS.forEach((field) => {
      formData.append(field, data[field] || "")
    })
  }

  return formData
}

/**
 * 从购物车初始化收货地址表单数据
 */
export function initShippingFormData(
  cart: HttpTypes.StoreCart | null
): AddressFormData {
  return {
    "shipping_address.first_name": cart?.shipping_address?.first_name || "",
    "shipping_address.last_name": cart?.shipping_address?.last_name || "",
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.address_2": cart?.shipping_address?.address_2 || "",
    "shipping_address.company": cart?.shipping_address?.company || "",
    "shipping_address.postal_code": cart?.shipping_address?.postal_code || "",
    "shipping_address.city": cart?.shipping_address?.city || "",
    "shipping_address.country_code": cart?.shipping_address?.country_code || "",
    "shipping_address.province": cart?.shipping_address?.province || "",
    "shipping_address.phone": cart?.shipping_address?.phone || "",
    email: cart?.email || "",
  }
}

/**
 * 从购物车初始化账单地址表单数据
 */
export function initBillingFormData(
  cart: HttpTypes.StoreCart | null
): AddressFormData {
  return {
    "billing_address.first_name": cart?.billing_address?.first_name || "",
    "billing_address.last_name": cart?.billing_address?.last_name || "",
    "billing_address.address_1": cart?.billing_address?.address_1 || "",
    "billing_address.address_2": cart?.billing_address?.address_2 || "",
    "billing_address.company": cart?.billing_address?.company || "",
    "billing_address.postal_code": cart?.billing_address?.postal_code || "",
    "billing_address.city": cart?.billing_address?.city || "",
    "billing_address.country_code": cart?.billing_address?.country_code || "",
    "billing_address.province": cart?.billing_address?.province || "",
    "billing_address.phone": cart?.billing_address?.phone || "",
  }
}

/**
 * 检查表单数据是否有有效值
 */
export function hasFormData(data: AddressFormData): boolean {
  return Object.values(data).some(
    (value) => value && String(value).trim() !== ""
  )
}

/**
 * 检查是否是购物车无效商品错误
 */
export function isInvalidCartItemError(error: string): boolean {
  return error.includes("do not exist") || error.includes("not published")
}
