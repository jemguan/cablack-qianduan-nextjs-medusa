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
  getRegionCountryCode,
  removeCartId,
  setCartId,
  setRegionCountryCode,
} from "./cookies"
import { getRegion } from "./regions"
import { getVipDiscount, getLoyaltyConfig } from "./loyalty"

/**
 * 失效产品库存相关的缓存
 * 在库存变化时调用（添加商品、更新数量、删除商品、下单等）
 */
async function revalidateProductInventoryCache() {
  const productsInventoryTag = await getCacheTag("products-inventory")
  if (productsInventoryTag) {
    revalidateTag(productsInventoryTag)
  }
  // 同时失效产品列表缓存
  const productsCacheTag = await getCacheTag("products")
  if (productsCacheTag) {
    revalidateTag(productsCacheTag)
  }
}

/**
 * 自动为 VIP 会员应用专属折扣码
 * 在添加商品到购物车后调用
 */
async function tryApplyVipDiscount(cartId: string): Promise<void> {
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

/**
 * 内部实现：获取购物车
 */
const _retrieveCartInternal = async (cartId?: string, fields?: string): Promise<HttpTypes.StoreCart | null> => {
  const id = cartId || (await getCartId())
  fields ??= "*items, *region, *items.product, *items.variant, *items.variant.images, *items.thumbnail, *items.metadata, +items.total, *promotions, +shipping_methods.name, +discount_total, +discount_subtotal, +item_subtotal, +item_total, +subtotal, +total, +tax_total, +shipping_subtotal, +shipping_total"

  if (!id) {
    return null
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("carts")),
  }

  const cacheConfig = getCacheConfig("CART")

  return await sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}`, {
      method: "GET",
      query: {
        fields
      },
      headers,
      next,
      ...cacheConfig,
    })
    .then(({ cart }: { cart: HttpTypes.StoreCart }) => cart)
    .catch(() => null)
}

/**
 * Retrieves a cart by its ID. If no ID is provided, it will use the cart ID from the cookies.
 * 使用 React cache() 在单次渲染周期内去重请求
 * @param cartId - optional - The ID of the cart to retrieve.
 * @returns The cart object if found, or null if not found.
 */
export const retrieveCart = cache(_retrieveCartInternal)

export async function getOrSetCart(countryCode: string) {
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  let cart = await retrieveCart(undefined, 'id,region_id')

  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!cart) {
    const cartResp = await sdk.store.cart.create(
      { region_id: region.id },
      {},
      headers
    )
    cart = cartResp.cart

    await setCartId(cart.id)

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  if (cart && cart?.region_id !== region.id) {
    await sdk.store.cart.update(cart.id, { region_id: region.id }, {}, headers)
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  return cart
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found, please create one before updating")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .update(cartId, data, {}, headers)
    .then(async ({ cart }: { cart: HttpTypes.StoreCart }) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)

      return cart
    })
    .catch(medusaError)
}

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
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
      
      // 失效产品库存缓存，因为添加商品会影响库存
      await revalidateProductInventoryCache()
      
      // 自动为 VIP 会员应用专属折扣码
      await tryApplyVipDiscount(cart.id)
    })
    .catch(medusaError)
}

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
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
      
      // 失效产品库存缓存，因为更新商品数量会影响库存
      await revalidateProductInventoryCache()
    })
    .catch(medusaError)
}

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
        const cartCacheTag = await getCacheTag("carts")
        revalidateTag(cartCacheTag)

        const fulfillmentCacheTag = await getCacheTag("fulfillment")
        revalidateTag(fulfillmentCacheTag)
        
        // 失效产品库存缓存，因为删除商品会影响库存
        await revalidateProductInventoryCache()
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

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .addShippingMethod(cartId, { option_id: shippingMethodId }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
    })
    .catch(medusaError)
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart | string,
  data: HttpTypes.StoreInitializePaymentSession
) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    // If cart is a string (cart ID), retrieve the cart first
    let cartObj: HttpTypes.StoreCart
    if (typeof cart === "string") {
      // Retrieve cart with payment_collection fields
      const retrievedCart = await retrieveCart(
        cart,
        "*items, *region, *items.product, *items.variant, *items.variant.images, *items.thumbnail, *items.metadata, +items.total, *promotions, +shipping_methods.name, *payment_collection, *payment_collection.payment_sessions"
      )
      if (!retrievedCart) {
        throw new Error("Cart not found. Please refresh the page and try again.")
      }
      cartObj = retrievedCart
    } else {
      cartObj = cart
    }

    // 验证购物车是否有必要的字段
    if (!cartObj.region_id) {
      throw new Error("Cart region is missing. Please refresh the page and try again.")
    }

    if (!cartObj.id) {
      throw new Error("Cart ID is missing. Please refresh the page and try again.")
    }

    // 只传递必要的字段，避免序列化问题
    // 创建一个最小化的购物车对象，只包含 API 需要的字段
    const minimalCart = {
      id: cartObj.id,
      region_id: cartObj.region_id,
      // 如果 payment_collection 存在，也传递它（但只传递必要的字段）
      ...(cartObj.payment_collection && {
        payment_collection: {
          id: cartObj.payment_collection.id,
        },
      }),
    }

    const resp = await sdk.store.payment.initiatePaymentSession(
      minimalCart as HttpTypes.StoreCart,
      data,
      {},
      headers
    )
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
    
    // 确保返回值可以被序列化（Next.js Server Actions 要求）
    // 只返回必要的字段，避免包含不可序列化的内容
    if (resp && typeof resp === 'object') {
      // 返回一个可序列化的对象
      return JSON.parse(JSON.stringify(resp))
    }
    
    return resp
  } catch (error: any) {
    // 提取友好的错误信息
    let errorMessage = "Failed to initialize payment session"
    
    // 记录错误日志（生产环境也记录，但不暴露敏感信息）
    try {
      if (error?.response) {
        // 处理 HTTP 响应错误
        const status = error.response.status
        const responseData = error.response.data
        
        // 记录详细错误信息
        console.error("initiatePaymentSession error:", {
          status,
          url: error?.config?.url,
          method: error?.config?.method,
          responseData: typeof responseData === "object" 
            ? JSON.stringify(responseData).substring(0, 500)
            : String(responseData).substring(0, 500),
        })
        
        if (status === 500) {
          // 检查是否是 Stripe 客户不存在错误
          const responseStr = typeof responseData === "string" 
            ? responseData 
            : JSON.stringify(responseData)
          
          if (responseStr.includes("No such customer") || responseStr.includes("customer")) {
            errorMessage = "Payment account error detected. Please refresh the page and try again. If the problem persists, please contact support."
          } else {
            errorMessage = "Payment service is temporarily unavailable. Please try again in a moment or contact support."
          }
        } else if (status === 401 || status === 403) {
          errorMessage = "Authentication failed. Please refresh the page and try again."
        } else if (status === 404) {
          errorMessage = "Payment method not found. Please refresh the page and try again."
        } else if (responseData?.message) {
          const msg = typeof responseData.message === "string" 
            ? responseData.message 
            : JSON.stringify(responseData.message)
          errorMessage = msg.substring(0, 200) // 限制长度避免序列化问题
        } else if (responseData) {
          errorMessage = typeof responseData === "string" 
            ? responseData.substring(0, 200)
            : "Payment initialization failed. Please try again."
        }
      } else if (error?.message) {
        const errorMsg = String(error.message)
        // 检查是否是 Stripe 客户不存在错误
        if (errorMsg.includes("No such customer") || errorMsg.includes("customer")) {
          errorMessage = "Payment account error detected. Please refresh the page and try again. If the problem persists, please contact support."
        } else {
          errorMessage = errorMsg.substring(0, 200)
        }
        console.error("initiatePaymentSession error:", {
          message: errorMessage,
          errorType: error?.name || "Unknown",
          ...(process.env.NODE_ENV === "development" && error?.stack 
            ? { stack: error.stack.substring(0, 500) }
            : {}),
        })
      } else {
        errorMessage = String(error).substring(0, 200)
        console.error("initiatePaymentSession error:", {
          error: errorMessage,
          type: typeof error,
        })
    }
    } catch (logError) {
      // 如果记录日志时出错，至少记录基本信息
      console.error("initiatePaymentSession: Failed to log error details", logError)
      errorMessage = "An unexpected error occurred. Please try again."
    }
    
    // 抛出友好的错误信息（确保错误可以被序列化）
    // 只抛出纯字符串错误，避免序列化问题
    throw new Error(errorMessage)
  }
}

export async function applyPromotions(codes: string[]): Promise<{ success: boolean; cart?: any }> {
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
    const response = await sdk.client.fetch<{ cart: any }>(`/store/carts/${cartId}/promotions`, {
      method: "POST",
      headers,
      body: {
        promo_codes: codes,
      },
    })

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)

    const fulfillmentCacheTag = await getCacheTag("fulfillment")
    revalidateTag(fulfillmentCacheTag)

    return { success: true, cart: response?.cart }
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
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
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

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)

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

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)

    const fulfillmentCacheTag = await getCacheTag("fulfillment")
    revalidateTag(fulfillmentCacheTag)
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error syncing bundle promotions:", error?.message)
    }
    // 不抛出错误，只记录日志
  }
}

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

// TODO: Pass a POJO instead of a form entity here
export async function setAddresses(currentState: unknown, formData: FormData) {
  try {
    if (!formData) {
      throw new Error("No form data found when setting addresses")
    }
    const cartId = getCartId()
    if (!cartId) {
      throw new Error("No existing cart found when setting addresses")
    }

    const data = {
      shipping_address: {
        first_name: formData.get("shipping_address.first_name"),
        last_name: formData.get("shipping_address.last_name"),
        address_1: formData.get("shipping_address.address_1"),
        address_2: "",
        company: formData.get("shipping_address.company"),
        postal_code: formData.get("shipping_address.postal_code"),
        city: formData.get("shipping_address.city"),
        country_code: formData.get("shipping_address.country_code"),
        province: formData.get("shipping_address.province"),
        phone: formData.get("shipping_address.phone"),
      },
      email: formData.get("email"),
    } as any

    const sameAsBilling = formData.get("same_as_billing")
    if (sameAsBilling === "on") data.billing_address = data.shipping_address

    if (sameAsBilling !== "on")
      data.billing_address = {
        first_name: formData.get("billing_address.first_name"),
        last_name: formData.get("billing_address.last_name"),
        address_1: formData.get("billing_address.address_1"),
        address_2: "",
        company: formData.get("billing_address.company"),
        postal_code: formData.get("billing_address.postal_code"),
        city: formData.get("billing_address.city"),
        country_code: formData.get("billing_address.country_code"),
        province: formData.get("billing_address.province"),
        phone: formData.get("billing_address.phone"),
      }
    await updateCart(data)
  } catch (e: any) {
    return e.message
  }
}

/**
 * Places an order for a cart. If no cart ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to place an order for.
 * @returns The cart object if the order was successful, or null if not.
 */
export async function placeOrder(cartId?: string) {
  const id = cartId || (await getCartId())

  if (!id) {
    throw new Error("No existing cart found when placing an order")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  // 在完成订单前，先刷新购物车状态以确保 shipping method 仍然有效
  try {
    const currentCart = await retrieveCart(
      id,
      "*items, *region, *items.product, *items.variant, *shipping_methods, *payment_collection, *payment_collection.payment_sessions"
    )

    if (!currentCart) {
      throw new Error("Cart not found")
    }

    // 验证购物车是否准备好完成订单
    if (!currentCart.shipping_address) {
      throw new Error("Shipping address is required")
    }

    if (!currentCart.billing_address) {
      throw new Error("Billing address is required")
    }

    if (!currentCart.email) {
      throw new Error("Email is required")
    }

    if (!currentCart.shipping_methods || currentCart.shipping_methods.length === 0) {
      throw new Error("Shipping method is required. Please select a shipping method.")
    }

    if (!currentCart.payment_collection?.payment_sessions || currentCart.payment_collection.payment_sessions.length === 0) {
      throw new Error("Payment session is required")
    }

    // 检查支付会话状态 - 放宽检查条件
    // Stripe 支付成功后，状态可能是 "authorized", "requires_more", "pending" (如果 webhook 还未处理)
    // 只要不是 "error" 或 "canceled"，都允许继续
    const paymentSessions = currentCart.payment_collection.payment_sessions
    const validPaymentSession = paymentSessions.find(
      (session) => {
        const status = session.status?.toLowerCase()
        // 允许的状态：authorized, requires_more, pending (Stripe 支付成功后可能还是 pending，等待 webhook)
        // 不允许的状态：error, canceled, null/undefined
        return status && 
          status !== "error" && 
          status !== "canceled" &&
          (status === "authorized" || 
           status === "requires_more" || 
           status === "pending" ||
           status === "requires_action")
      }
    )

    if (!validPaymentSession) {
      // 检查是否有 Stripe 支付会话
      const stripeSession = paymentSessions.find(s => s.provider_id === "stripe")
      if (stripeSession) {
        // 对于 Stripe，如果状态是 pending，可能是 webhook 还未处理，允许继续尝试
        // Medusa 会在 complete 时验证支付状态
        if (stripeSession.status === "pending") {
          // 允许继续，Medusa 会在 complete 时验证
        } else {
          throw new Error(`Payment session status is ${stripeSession.status}. Please complete the payment first.`)
        }
      } else {
        throw new Error("No valid payment session found. Please complete the payment first.")
      }
    }
  } catch (error: any) {
    // 如果是验证错误，直接抛出
    if (error.message && (
      error.message.includes("required") ||
      error.message.includes("not authorized") ||
      error.message.includes("not found") ||
      error.message.includes("Payment session")
    )) {
      throw error
    }
    // 其他错误继续处理，可能是网络问题
    console.error("Error validating cart before placing order:", error)
  }

  const cartRes = await sdk.store.cart
    .complete(id, {}, headers)
    .then(async (cartRes) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      
      // 失效产品库存缓存，因为下单会消耗库存
      await revalidateProductInventoryCache()
      
      return cartRes
    })
    .catch((error: any) => {
      // 提供更友好的错误信息
      const errorMessage = error?.message || ""
      
      if (errorMessage.includes("shipping profiles") || errorMessage.includes("shipping methods")) {
        throw new Error("The selected shipping method is no longer valid for the items in your cart. Please go back and select a different shipping method.")
      }
      
      // 处理支付会话删除错误 - 这通常不影响订单完成
      if (errorMessage.includes("Could not delete all payment sessions") || 
          errorMessage.includes("delete.*payment.*session")) {
        // 这个错误通常不影响订单完成，Medusa 可能已经创建了订单
        // 尝试重新获取购物车状态，检查订单是否已创建
        console.warn("Payment session deletion warning (may not affect order completion):", errorMessage)
        // 继续抛出错误，让调用者决定如何处理
      }
      
      // 处理支付授权错误
      if (errorMessage.includes("not authorized") || 
          errorMessage.includes("Payment session") ||
          errorMessage.includes("payment.*authorized")) {
        throw new Error("Payment verification failed. Please ensure payment was completed successfully and try again.")
      }
      
      throw medusaError(error)
    })

  if (cartRes?.type === "order") {
    const orderCacheTag = await getCacheTag("orders")
    revalidateTag(orderCacheTag)

    removeCartId()
    
    // Return order info instead of redirecting
    // Client component will handle the redirect
    return {
      type: "order" as const,
      order: cartRes.order,
      redirectUrl: `/order/${cartRes.order.id}/confirmed`,
    }
  }

  return cartRes.cart
}

/**
 * Updates the region by setting the cookie and updating the cart.
 * No longer redirects - the caller should refresh the page.
 * @param countryCode - The country code to set
 */
export async function updateRegion(countryCode: string) {
  const cartId = await getCartId()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  // Update the region cookie
  await setRegionCountryCode(countryCode)

  // Update cart region if cart exists
  if (cartId) {
    await updateCart({ region_id: region.id })
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  // Revalidate caches
  const regionCacheTag = await getCacheTag("regions")
  revalidateTag(regionCacheTag)

  const productsCacheTag = await getCacheTag("products")
  revalidateTag(productsCacheTag)
}

export async function listCartOptions() {
  const cartId = await getCartId()
  const headers = {
    ...(await getAuthHeaders()),
  }
  const next = {
    ...(await getCacheOptions("shippingOptions")),
  }

  const cacheConfig = getCacheConfig("FULFILLMENT")

  return await sdk.client.fetch<{
    shipping_options: HttpTypes.StoreCartShippingOption[]
  }>("/store/shipping-options", {
    query: { cart_id: cartId },
    next,
    headers,
    ...cacheConfig,
  })
}
