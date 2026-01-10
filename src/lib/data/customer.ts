"use server"

import { sdk } from "@lib/config"
import { getCacheConfig } from "@lib/config/cache"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { cache } from "react"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeAuthToken,
  removeCartId,
  setAuthToken,
  setCartId,
} from "./cookies"

/**
 * 内部实现：获取客户信息
 * 使用 React cache() 在单次渲染周期内去重请求
 */
const _retrieveCustomerInternal = async (): Promise<HttpTypes.StoreCustomer | null> => {
    try {
      const authHeaders = await getAuthHeaders()

      if (!authHeaders) return null

      const headers = {
        ...authHeaders,
      }

      const next = {
        ...(await getCacheOptions("customers")),
      }

      const cacheConfig = getCacheConfig("CUSTOMER")

      // 先尝试带 fields 参数的请求（获取 orders）
      try {
        const response = await sdk.client
          .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
            method: "GET",
            query: {
              fields: "*orders",
            },
            headers,
            next,
            ...cacheConfig,
          })
        return response.customer
      } catch (error: any) {
        // 检查是否是客户被删除的情况
        // 这里的 error 结构可能不同，视 SDK 版本而定
        const status = error?.response?.status || error?.status
        if (status === 404) {
          try {
            const errorData = error?.response?.data || error?.data || await error?.response?.json().catch(() => ({}))
            if (errorData?.deleted === true) {
              console.warn("[Server Action] Customer was deleted, clearing auth token")
              await removeAuthToken()
              return null
            }
          } catch (e) {
            console.error("[Server Action] Failed to parse 404 error response:", e)
          }
        }
        
        // 如果带 fields 的请求失败（可能是 401），回退到不带 fields 的请求
        try {
          const response = await sdk.client
            .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
              method: "GET",
              headers,
              next,
              ...cacheConfig,
            })
          return response.customer
        } catch (fallbackError: any) {
          const fallbackStatus = fallbackError?.response?.status || fallbackError?.status
          if (fallbackStatus === 404) {
            try {
              const errorData = fallbackError?.response?.data || fallbackError?.data || await fallbackError?.response?.json().catch(() => ({}))
              if (errorData?.deleted === true) {
                console.warn("[Server Action] Customer was deleted (fallback), clearing auth token")
                await removeAuthToken()
                return null
              }
            } catch (e) {}
          }
          return null
        }
      }
    } catch (error: any) {
      // 捕获所有错误，包括 SDK 初始化错误、网络错误等
      // 静默返回 null，不抛出异常
      if (process.env.NODE_ENV === 'development') {
        console.warn("[Customer] Error in _retrieveCustomerInternal:", error?.message || error)
      }
      return null
    }
  }

/**
 * 获取当前客户信息
 * 使用 React cache() 在单次渲染周期内去重请求
 * 这意味着在同一次服务端渲染中，多个组件调用此函数只会发送一次请求
 */
export const retrieveCustomer = cache(_retrieveCustomerInternal)

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const updateRes = await sdk.store.customer
    .update(body, {}, headers)
    .then(({ customer }) => customer)
    .catch(medusaError)

  const cacheTag = await getCacheTag("customers")
  revalidateTag(cacheTag)

  return updateRes
}

export async function signup(_currentState: unknown, formData: FormData) {
  const password = formData.get("password") as string
  const customerForm = {
    email: formData.get("email") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    phone: formData.get("phone") as string,
  }

  try {
    const token = await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password: password,
    })

    await setAuthToken(token as string)

    const headers = {
      ...(await getAuthHeaders()),
    }

    const { customer: createdCustomer } = await sdk.store.customer.create(
      customerForm,
      {},
      headers
    )

    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email: customerForm.email,
      password,
    })

    await setAuthToken(loginToken as string)

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)

    await transferCart()

    return createdCustomer
  } catch (error: any) {
    return error.toString()
  }
}

export async function login(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    await sdk.auth
      .login("customer", "emailpass", { email, password })
      .then(async (token) => {
        await setAuthToken(token as string)
        const customerCacheTag = await getCacheTag("customers")
        revalidateTag(customerCacheTag)
      })
  } catch (error: any) {
    return error.toString()
  }

  // 尝试转移购物车，如果失败不影响登录流程
  try {
    await transferCart()
  } catch (error: any) {
    // 记录错误但不阻止登录
    console.error("Failed to transfer cart after login:", error?.message || error)
    // 不返回错误，让用户登录成功，购物车转移失败会显示 banner
  }
}

export async function signout() {
  await sdk.auth.logout()

  await removeAuthToken()

  const customerCacheTag = await getCacheTag("customers")
  revalidateTag(customerCacheTag)

  await removeCartId()

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)

  redirect(`/account`)
}

export async function transferCart() {
  const cartId = await getCartId()

  if (!cartId) {
    return
  }

  const headers = await getAuthHeaders()

  // 检查是否有认证 token（用户必须已登录）
  if (!headers.authorization) {
    throw new Error("User must be authenticated to transfer cart")
  }

  try {
    // 先检查购物车是否已经有 customer_id，如果有则不需要转移
    const { retrieveCart } = await import("./cart")
    const cart = await retrieveCart(cartId)
    
    if (cart?.customer_id) {
      // 购物车已经有 customer_id，不需要转移
      return { cart }
    }

    // 调用转移 API
    const result = await sdk.store.cart.transferCart(cartId, {}, headers)
    
    // 如果转移成功，更新购物车缓存
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
    
    // 如果返回了新的购物车，可能需要更新购物车 ID
    if (result?.cart?.id && result.cart.id !== cartId) {
      await setCartId(result.cart.id)
    }
    
    return result
  } catch (error: any) {
    // 使用 medusaError 处理错误，提供更友好的错误信息
    throw medusaError(error)
  }
}

/**
 * Google OAuth 回调处理（Server Action）
 * 验证 Google 返回的 code 和 state，并创建或登录客户
 */
export async function handleGoogleCallback(queryParams: Record<string, string>) {
  try {
    const baseUrl = process.env.MEDUSA_BACKEND_URL || 
                   process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 
                   "http://localhost:9000"

    // 调用 Medusa 的 callback API 验证 Google 认证
    const response = await fetch(
      `${baseUrl}/auth/customer/google/callback?${new URLSearchParams(queryParams).toString()}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Authentication failed" }))
      return { success: false, error: errorData.message || "Authentication failed" }
    }

    const data = await response.json()
    const token = data.token

    if (!token || typeof token !== "string") {
      return { success: false, error: "Authentication failed: Invalid token" }
    }

    // 设置认证 token 到 cookie
    await setAuthToken(token)

    const headers = {
      ...(await getAuthHeaders()),
    }

    // 解码 token 检查客户是否已注册
    // 注意：这里我们需要手动解码 JWT，或者调用 API 检查
    // 为了简化，我们直接尝试获取客户，如果失败则创建

    let customer: HttpTypes.StoreCustomer | null = null
    
    try {
      customer = await retrieveCustomer()
    } catch (error) {
      // 客户不存在，需要创建
      // 从 token 中提取 email（需要解码 JWT）
      // 这里我们尝试创建一个基本客户
      // 注意：实际应用中应该从 token 中提取用户信息
    }

    // 如果客户不存在，尝试创建
    if (!customer) {
      try {
        // 注意：这里需要从 Google 获取用户信息
        // 暂时跳过，让前端处理
      } catch (createError) {
        // 创建失败，继续
      }
    }

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)

    await transferCart()

    return { success: true, customer, token }
  } catch (error: any) {
    return { success: false, error: error.toString() }
  }
}

export const addCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const isDefaultBilling = (currentState.isDefaultBilling as boolean) || false
  const isDefaultShipping = (currentState.isDefaultShipping as boolean) || false

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
    is_default_billing: isDefaultBilling,
    is_default_shipping: isDefaultShipping,
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .createAddress(address, {}, headers)
    .then(async ({ customer }) => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<void> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.customer
    .deleteAddress(addressId, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const addressId =
    (currentState.addressId as string) || (formData.get("addressId") as string)

  if (!addressId) {
    return { success: false, error: "Address ID is required" }
  }

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
  } as HttpTypes.StoreUpdateCustomerAddress

  const phone = formData.get("phone") as string

  if (phone) {
    address.phone = phone
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}
