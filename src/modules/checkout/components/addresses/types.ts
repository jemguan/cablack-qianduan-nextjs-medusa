/**
 * Addresses 模块类型定义
 */

import type { HttpTypes } from "@medusajs/types"

/**
 * 地址表单数据
 */
export type AddressFormData = Record<string, string>

/**
 * 收货地址必填字段
 */
export const REQUIRED_SHIPPING_FIELDS = [
  "shipping_address.first_name",
  "shipping_address.last_name",
  "shipping_address.address_1",
  "shipping_address.postal_code",
  "shipping_address.city",
  "shipping_address.country_code",
  "shipping_address.province",
  "shipping_address.phone",
  "email",
] as const

/**
 * 账单地址必填字段
 */
export const REQUIRED_BILLING_FIELDS = [
  "billing_address.first_name",
  "billing_address.last_name",
  "billing_address.address_1",
  "billing_address.postal_code",
  "billing_address.city",
  "billing_address.country_code",
  "billing_address.province",
  "billing_address.phone",
] as const

/**
 * 收货地址字段列表
 */
export const SHIPPING_ADDRESS_FIELDS = [
  "shipping_address.first_name",
  "shipping_address.last_name",
  "shipping_address.address_1",
  "shipping_address.address_2",
  "shipping_address.company",
  "shipping_address.postal_code",
  "shipping_address.city",
  "shipping_address.country_code",
  "shipping_address.province",
  "shipping_address.phone",
  "email",
] as const

/**
 * 账单地址字段列表
 */
export const BILLING_ADDRESS_FIELDS = [
  "billing_address.first_name",
  "billing_address.last_name",
  "billing_address.address_1",
  "billing_address.address_2",
  "billing_address.company",
  "billing_address.postal_code",
  "billing_address.city",
  "billing_address.country_code",
  "billing_address.province",
  "billing_address.phone",
] as const

/**
 * Addresses 组件 Props
 */
export interface AddressesProps {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}

/**
 * 保存状态
 */
export interface SaveState {
  isSaving: boolean
  saveError: string | null
  saveSuccess: boolean
}
