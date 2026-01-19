"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { getAuthHeaders, getCartId, getCacheTag } from "../cookies"
import { retrieveCart } from "./cart-retrieval"
import { revalidateCartCache, revalidateCartAndFulfillmentCache } from "./cart-cache"

/**
 * 应用促销码
 */
export async function applyPromotions(codes: string[]): Promise<{
  success: boolean
  cart?: any
  appliedCodes?: string[]
  requestedCodes?: string[]
  errors?: any
}> {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found")
  }

  if (!codes || codes.length === 0) {
    return { success: false }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  // 使用专门的 promotions 端点
  // SDK 会自动处理 JSON 序列化，不需要手动 JSON.stringify
  try {
    const response = await sdk.client.fetch<{ cart: any; errors?: any }>(`/store/carts/${cartId}/promotions`, {
      method: "POST",
      headers,
      body: {
        promo_codes: codes,
      },
    })

    await revalidateCartAndFulfillmentCache()

    // 检查响应中的 promotions，确认哪些折扣码被成功应用
    const appliedPromotions = response?.cart?.promotions || []
    const appliedCodes = appliedPromotions
      .filter((p: any) => p.code)
      .map((p: any) => p.code.toLowerCase())

    // 为了更准确地验证，重新获取购物车以确认折扣码是否真的被应用
    // 这对于检测"使用次数达上限"等情况很重要
    let verifiedCart = response?.cart
    try {
      const verifiedCartResponse = await sdk.client.fetch<{ cart: any }>(
        `/store/carts/${cartId}?fields=*promotions`,
        {
          method: "GET",
          headers,
        }
      )
      verifiedCart = verifiedCartResponse?.cart

      // 更新应用的折扣码列表
      const verifiedPromotions = verifiedCart?.promotions || []
      const verifiedAppliedCodes = verifiedPromotions
        .filter((p: any) => p.code)
        .map((p: any) => p.code.toLowerCase())

      return {
        success: true,
        cart: verifiedCart,
        appliedCodes: verifiedAppliedCodes,
        requestedCodes: codes.map(c => c.toLowerCase()),
        errors: response?.errors
      }
    } catch (verifyError) {
      // 如果验证失败，使用原始响应
      return {
        success: true,
        cart: response?.cart,
        appliedCodes,
        requestedCodes: codes.map(c => c.toLowerCase()),
        errors: response?.errors
      }
    }
  } catch (error: any) {
    // 如果是 promotion 相关的错误，返回失败而不是抛出
    if (error?.message?.includes("promotion") || error?.message?.includes("code")) {
      throw new Error(error?.message || "Invalid promotion code")
    }
    medusaError(error)
    return { success: false }
  }
}

/**
 * 移除指定的 Promotion
 * @param code Promotion 代码
 */
export async function removePromotion(code: string) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  // 获取当前购物车的所有 Promotion
  const cart = await retrieveCart(cartId)
  if (!cart) {
    throw new Error("Cart not found")
  }

  // 过滤掉要移除的 Promotion
  const remainingCodes =
    cart.promotions
      ?.filter((promo) => promo.code !== code)
      .map((promo) => promo.code!)
      .filter((code): code is string => code !== undefined) || []

  // 更新购物车的 Promotion 列表
  return sdk.store.cart
    .update(cartId, { promo_codes: remainingCodes }, {}, headers)
    .then(async () => {
      await revalidateCartAndFulfillmentCache()
    })
    .catch(medusaError)
}

/**
 * 为 Bundle 创建单次使用的 Promotion
 * @param bundleId Bundle ID
 * @returns Promotion code 和 ID
 */
export async function createBundlePromotion(bundleId: string): Promise<{
  promotion_id: string
  promotion_code: string
} | null> {
  try {
    const cartId = await getCartId()
    if (!cartId) {
      throw new Error("No cart ID found")
    }

    const headers = {
      ...(await getAuthHeaders()),
    }

    // 调用后端 API 创建单次使用的 Promotion
    // SDK 会自动处理 JSON 序列化，不需要手动 JSON.stringify
    const response = await sdk.client.fetch<{
      promotion_id: string
      promotion_code: string
    }>(`/store/bundles/${bundleId}/create-promotion`, {
      method: "POST",
      headers,
      body: {
        cart_id: cartId,
      },
    })

    // 注意：不在这里应用 Promotion，因为此时购物车中还没有产品
    // Promotion 将在所有产品添加到购物车后应用

    await revalidateCartCache()

    return response
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error creating bundle promotion:", error?.message)
    }
    throw error
  }
}

/**
 * 同步捆绑包折扣
 * 检查购物车中的产品是否属于捆绑包，并自动应用/移除对应的 Promotion
 */
export async function syncBundlePromotions() {
  try {
    const cartId = await getCartId()
    if (!cartId) {
      return
    }

    const headers = {
      ...(await getAuthHeaders()),
    }

    // 调用后端 API 获取需要应用/移除的 Promotion
    const response = await sdk.client.fetch<{
      promotionsToApply: string[]
      promotionsToRemove: string[]
      updatedPromotionCodes: string[]
    }>(`/store/carts/${cartId}/sync-bundle-promotions`, {
      method: "POST",
      headers,
    })

    // 应用更新后的 Promotion codes
    if (response.updatedPromotionCodes && response.updatedPromotionCodes.length > 0) {
      await applyPromotions(response.updatedPromotionCodes)
    }

    await revalidateCartAndFulfillmentCache()
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error syncing bundle promotions:", error?.message)
    }
    // 不抛出错误，只记录日志
  }
}

/**
 * 提交促销表单
 */
export async function submitPromotionForm(
  currentState: unknown,
  formData: FormData
) {
  const code = formData.get("code") as string
  try {
    await applyPromotions([code])
  } catch (e: any) {
    return e.message
  }
}

/**
 * 礼品卡相关功能（待实现）
 */
export async function applyGiftCard(code: string) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, { gift_cards: [{ code }] }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function removeDiscount(code: string) {
  // const cartId = getCartId()
  // if (!cartId) return "No cartId cookie found"
  // try {
  //   await deleteDiscount(cartId, code)
  //   revalidateTag("cart")
  // } catch (error: any) {
  //   throw error
  // }
}

export async function removeGiftCard(
  codeToRemove: string,
  giftCards: any[]
  // giftCards: GiftCard[]
) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, {
  //       gift_cards: [...giftCards]
  //         .filter((gc) => gc.code !== codeToRemove)
  //         .map((gc) => ({ code: gc.code })),
  //     }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}
