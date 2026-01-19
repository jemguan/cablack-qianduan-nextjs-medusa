"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getAuthHeaders } from "../cookies"
import { getVipDiscount, getLoyaltyConfig } from "../loyalty"

/**
 * 自动为 VIP 会员应用专属折扣码
 * 在添加商品到购物车后调用
 */
export async function tryApplyVipDiscount(cartId: string): Promise<void> {
  try {
    // 检查积分系统是否启用，如果未启用则不应用 VIP 折扣
    const loyaltyConfig = await getLoyaltyConfig()
    if (!loyaltyConfig?.config?.is_points_enabled) {
      return
    }

    // 获取 VIP 折扣信息
    const vipDiscount = await getVipDiscount()

    if (!vipDiscount.is_vip || !vipDiscount.discount_code) {
      return
    }

    const discountCode = vipDiscount.discount_code

    // 获取当前购物车的 promotions 和 customer_id
    const headers = {
      ...(await getAuthHeaders()),
    }

    // 获取购物车以检查是否已应用折扣码和客户关联
    const cartResponse = await sdk.client.fetch<{ cart: HttpTypes.StoreCart }>(
      `/store/carts/${cartId}?fields=*promotions,customer_id`,
      {
        method: "GET",
        headers,
      }
    )

    const cart = cartResponse?.cart

    // 检查购物车是否关联了客户
    if (!cart?.customer_id) {
      // 尝试转移购物车到当前用户
      try {
        const transferResult = await sdk.store.cart.transferCart(cartId, {}, headers)
        if (transferResult?.cart?.customer_id) {
          // 更新本地 cart 引用
          Object.assign(cart, transferResult.cart)
        } else {
          return
        }
      } catch (transferError) {
        return
      }
    }

    const existingPromotions = cart?.promotions || []
    const isAlreadyApplied = existingPromotions.some(
      (p) => p.code?.toLowerCase() === discountCode.toLowerCase()
    )

    if (isAlreadyApplied) {
      return
    }

    // 获取现有的折扣码
    const existingCodes = existingPromotions
      .filter((p) => p.code)
      .map((p) => p.code!)

    // 添加 VIP 折扣码
    const newCodes = [...existingCodes, discountCode]

    // 应用折扣码
    await sdk.client.fetch<{ cart: HttpTypes.StoreCart }>(`/store/carts/${cartId}/promotions`, {
      method: "POST",
      headers,
      body: {
        promo_codes: newCodes,
      },
    })
  } catch (error) {
    // 静默失败，不影响添加商品操作
  }
}
