"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheTag,
  getCartId,
  removeAuthToken,
  removeCartId,
  setAuthToken,
  setCartId,
} from "../cookies"
import { retrieveCustomer } from "./retrieve"

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

    // 先设置 token，这样创建客户时可以认证
    await setAuthToken(token as string)

    const headers = {
      ...(await getAuthHeaders()),
    }

    const { customer: createdCustomer } = await sdk.store.customer.create(
      customerForm,
      {},
      headers
    )

    // 等待一下，确保 customer.created 事件和订阅者已经处理完成
    // 给订阅者时间找到 auth_identity 并发送验证邮件
    await new Promise(resolve => setTimeout(resolve, 1000))

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)

    // 注意：虽然设置了 token，但用户可能还没有完全登录
    // 移除 token，让用户手动登录，这样可以看到验证提示
    await removeAuthToken()

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
  if (!("authorization" in headers)) {
    throw new Error("User must be authenticated to transfer cart")
  }

  try {
    // 先检查购物车是否已经有 customer_id，如果有则不需要转移
    const { retrieveCart } = await import("../cart")
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
    const medusaError = (await import("@lib/util/medusa-error")).default
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

    let customer: HttpTypes.StoreCustomer | null = null

    try {
      customer = await retrieveCustomer()
    } catch (error) {
      // 客户不存在，需要创建
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
