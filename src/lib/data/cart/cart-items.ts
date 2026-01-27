"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { getAuthHeaders, getCartId, getRegionCountryCode } from "../cookies"
import { getOrSetCart } from "./cart-retrieval"
import { revalidateCartAndFulfillmentCache } from "./cart-cache"
import { tryApplyVipDiscount } from "./cart-vip"

/**
 * 添加商品到购物车
 */
export async function addToCart({
  variantId,
  quantity,
  countryCode,
  metadata,
}: {
  variantId: string
  quantity: number
  countryCode?: string
  metadata?: Record<string, any>
}) {
  if (!variantId) {
    throw new Error("Missing variant ID when adding to cart")
  }

  // If no countryCode provided, get from cookie
  const resolvedCountryCode = countryCode || await getRegionCountryCode()
  const cart = await getOrSetCart(resolvedCountryCode)

  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .createLineItem(
      cart.id,
      {
        variant_id: variantId,
        quantity,
        metadata,
      },
      {},
      headers
    )
    .then(async () => {
      await revalidateCartAndFulfillmentCache()

      // 注意：移除了 revalidateProductInventoryCache() 调用
      // 因为它会导致整个产品列表重新渲染，造成按钮闪烁
      // 库存会在页面刷新或用户重新访问时更新

      // 自动为 VIP 会员应用专属折扣码
      await tryApplyVipDiscount(cart.id)
    })
    .catch(medusaError)
}

/**
 * 更新购物车商品数量
 */
export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string
  quantity: number
}) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when updating line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when updating line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .updateLineItem(cartId, lineId, { quantity }, {}, headers)
    .then(async () => {
      await revalidateCartAndFulfillmentCache()
      // 注意：移除了 revalidateProductInventoryCache() 调用以避免按钮闪烁
    })
    .catch(medusaError)
}

/**
 * 删除购物车商品
 */
export async function deleteLineItem(lineId: string): Promise<{ success: boolean; error?: string }> {
  if (!lineId) {
    return { success: false, error: "Missing lineItem ID when deleting line item" }
  }

  const cartId = await getCartId()

  if (!cartId) {
    return { success: false, error: "Missing cart ID when deleting line item" }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    await sdk.store.cart
      .deleteLineItem(cartId, lineId, {}, headers)
      .then(async () => {
        await revalidateCartAndFulfillmentCache()
        // 注意：移除了 revalidateProductInventoryCache() 调用以避免按钮闪烁
      })

    return { success: true }
  } catch (error: any) {
    // 记录详细错误信息以便调试
    console.error("[deleteLineItem] Error details:", {
      cartId,
      lineId,
      error: error?.message || error,
      response: error?.response?.data,
      status: error?.response?.status,
    })

    // 提取错误消息
    let errorMessage = "Failed to delete item"
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error?.message) {
      errorMessage = error.message
    }

    return { success: false, error: errorMessage }
  }
}
