"use server"

import { sdk } from "@lib/config"
import { getCacheConfig } from "@lib/config/cache"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { cache } from "react"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  removeAuthToken,
} from "../cookies"

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
