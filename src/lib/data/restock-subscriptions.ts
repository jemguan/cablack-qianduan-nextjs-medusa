"use server"

import { sdk } from "@lib/config"
import { revalidateTag } from "next/cache"
import { getAuthHeaders } from "./cookies"

export interface RestockSubscription {
  id: string
  customer_id: string
  email: string
  product_id: string
  variant_id: string
  status: "active" | "purchased"
  last_notified_at: string | null
  last_restocked_at: string | null
  notification_count: number
  created_at: string
  updated_at: string
}

export interface RestockSubscriptionResponse {
  subscription: RestockSubscription
}

export interface RestockSubscriptionListResponse {
  subscriptions: RestockSubscription[]
  count: number
  limit: number
  offset: number
}

export interface SubscribeToRestockData {
  product_id: string
  variant_id: string
  email: string
}

const RESTOCK_CACHE_TAG = "restock_subscriptions"

/**
 * 获取当前客户的活跃缺货通知订阅
 */
export async function getRestockSubscriptions(
  limit = 20,
  offset = 0
): Promise<RestockSubscriptionListResponse> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const result = await sdk.client
    .fetch<RestockSubscriptionListResponse>(
      `/store/restock-subscriptions?limit=${limit}&offset=${offset}`,
      {
        headers,
      }
    )
    .catch((err) => {
      console.error("Failed to fetch restock subscriptions:", err)
      return {
        subscriptions: [],
        count: 0,
        limit,
        offset,
      }
    })

  return result
}

/**
 * 订阅产品缺货通知
 */
export async function subscribeToRestock(
  data: SubscribeToRestockData
): Promise<RestockSubscription> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const result = await sdk.client
    .fetch<RestockSubscriptionResponse>(`/store/restock-subscriptions`, {
      method: "POST",
      body: data,
      headers,
    })
    .catch((err) => {
      console.error("Failed to subscribe to restock:", err)
      throw err
    })

  revalidateTag(RESTOCK_CACHE_TAG)
  return result.subscription
}

/**
 * 取消缺货通知订阅
 */
export async function unsubscribeFromRestock(subscriptionId: string): Promise<void> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.client
    .fetch(`/store/restock-subscriptions/${subscriptionId}`, {
      method: "DELETE",
      headers,
    })
    .catch((err) => {
      console.error("Failed to unsubscribe from restock:", err)
      throw err
    })

  revalidateTag(RESTOCK_CACHE_TAG)
}

/**
 * 检查客户是否已订阅特定变体
 */
export async function checkRestockSubscribed(
  variantId: string
): Promise<boolean> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const result = await sdk.client
    .fetch<{ subscribed: boolean }>(
      `/store/restock-subscriptions/check`,
      {
        method: "POST",
        body: { variant_id: variantId },
        headers,
      }
    )
    .catch((err) => {
      console.error("Failed to check subscription status:", err)
      return { subscribed: false }
    })

  return result.subscribed
}
