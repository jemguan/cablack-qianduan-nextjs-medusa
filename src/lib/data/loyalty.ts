"use server"

import { sdk } from "@lib/config"
import { getCacheConfig } from "@lib/config/cache"
import medusaError from "@lib/util/medusa-error"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { revalidateTag } from "next/cache"
import { cache } from "react"
import {
  LoyaltyAccountResponse,
  LoyaltyTransactionsResponse,
  RewardRulesResponse,
  RedeemCouponResponse,
  RedeemItemResponse,
} from "@/types/loyalty"

const LOYALTY_CACHE_TAG = "loyalty"

/**
 * 内部实现：获取当前用户的积分账户信息
 */
async function _getLoyaltyAccountInternal(): Promise<LoyaltyAccountResponse | null> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("loyalty")),
  }

  // 用户积分账户使用 no-cache，确保实时性
  const cacheConfig = getCacheConfig("CUSTOMER")

  return await sdk.client
    .fetch<LoyaltyAccountResponse>(`/store/loyalty/account`, {
      method: "GET",
      headers,
      next,
      ...cacheConfig,
    })
    .catch((err) => {
      // 如果用户未登录，返回 null
      if (err?.status === 401) {
        return null
      }
      console.error("[Loyalty] Failed to get account:", err)
      return null
    })
}

/**
 * 获取当前用户的积分账户信息
 * 使用 React cache() 在单次渲染周期内去重请求
 */
export const getLoyaltyAccount = cache(_getLoyaltyAccountInternal)

/**
 * 获取积分交易历史（支持分页）
 * 注意：因为有分页参数，不使用 cache() 包装
 */
export async function getLoyaltyTransactions(params?: {
  page?: number
  limit?: number
}): Promise<LoyaltyTransactionsResponse> {
  const { page = 1, limit = 10 } = params || {}
  const offset = (page - 1) * limit

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("loyalty")),
  }

  // 用户交易记录使用 no-cache
  const cacheConfig = getCacheConfig("CUSTOMER")

  return await sdk.client
    .fetch<LoyaltyTransactionsResponse>(`/store/loyalty/transactions`, {
      method: "GET",
      query: {
        limit: limit.toString(),
        offset: offset.toString(),
      },
      headers,
      next,
      ...cacheConfig,
    })
    .catch((err) => {
      if (err?.status === 401) {
        return {
          transactions: [],
          count: 0,
          offset: 0,
          limit,
        }
      }
      return medusaError(err)
    })
}

/**
 * 内部实现：获取可兑换商品列表
 */
async function _getRewardRulesInternal(params?: {
  limit?: number
  offset?: number
}): Promise<RewardRulesResponse> {
  const { limit = 50, offset = 0 } = params || {}

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("loyalty")),
  }

  // 兑换规则是公共数据，可使用中期缓存（5分钟）
  const cacheConfig = getCacheConfig("LOYALTY_RULES")

  return await sdk.client
    .fetch<RewardRulesResponse>(`/store/loyalty/reward-rules`, {
      method: "GET",
      query: {
        limit: limit.toString(),
        offset: offset.toString(),
        is_active: "true",
      },
      headers,
      next,
      ...cacheConfig,
    })
    .catch((err) => {
      console.error("[Loyalty] Failed to get reward rules:", err)
      return {
        rules: [],
        count: 0,
        offset: 0,
        limit,
      }
    })
}

/**
 * 获取可兑换商品列表
 * 使用 React cache() 在单次渲染周期内去重请求
 */
export const getRewardRules = cache(_getRewardRulesInternal)

/**
 * 使用积分兑换优惠券
 */
export async function redeemCoupon(
  points: number
): Promise<RedeemCouponResponse> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const result = await sdk.client
    .fetch<RedeemCouponResponse>(`/store/loyalty/redeem-coupon`, {
      method: "POST",
      headers,
      body: { points },
    })
    .catch(medusaError)

  // 刷新缓存
  revalidateTag(LOYALTY_CACHE_TAG)

  return result
}

/**
 * 使用积分兑换商品
 */
export async function redeemItem(
  variantId: string,
  quantity: number = 1
): Promise<RedeemItemResponse> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const result = await sdk.client
    .fetch<RedeemItemResponse>(`/store/loyalty/redeem-item`, {
      method: "POST",
      headers,
      body: {
        variant_id: variantId,
        quantity,
      },
    })
    .catch(medusaError)

  // 刷新缓存
  revalidateTag(LOYALTY_CACHE_TAG)

  return result
}

/**
 * 刷新积分缓存
 */
export async function refreshLoyaltyCache() {
  revalidateTag(LOYALTY_CACHE_TAG)
}

/**
 * VIP 折扣响应类型
 */
export type VipDiscountResponse = {
  is_vip: boolean
  discount_code: string | null
  membership_expires_at?: string
}

/**
 * 获取 VIP 会员专属折扣码
 * 如果用户是 VIP 会员且配置了折扣码，则返回折扣码
 */
export async function getVipDiscount(): Promise<VipDiscountResponse> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("loyalty")),
  }

  // 使用短期缓存
  const cacheConfig = getCacheConfig("CUSTOMER")

  return await sdk.client
    .fetch<VipDiscountResponse>(`/store/loyalty/vip-discount`, {
      method: "GET",
      headers,
      next,
      ...cacheConfig,
    })
    .catch((err) => {
      // 如果用户未登录或其他错误，返回非 VIP
      if (err?.status === 401) {
        return {
          is_vip: false,
          discount_code: null,
        }
      }
      console.error("[Loyalty] Failed to get VIP discount:", err)
      return {
        is_vip: false,
        discount_code: null,
      }
    })
}
