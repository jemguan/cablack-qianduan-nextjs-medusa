"use server"

import { sdk } from "@lib/config"
import { getCacheConfig } from "@lib/config/cache"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
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

/**
 * Retrieves a cart by its ID. If no ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to retrieve.
 * @returns The cart object if found, or null if not found.
 */
export async function retrieveCart(cartId?: string, fields?: string) {
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
    })
    .catch(medusaError)
}

export async function deleteLineItem(lineId: string) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when deleting line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when deleting line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .deleteLineItem(cartId, lineId, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
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
        throw new Error("Cart not found")
      }
      cartObj = retrievedCart
    } else {
      cartObj = cart
    }

    const resp = await sdk.store.payment.initiatePaymentSession(
      cartObj,
      data,
      {},
      headers
    )
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
    return resp
  } catch (error: any) {
    console.error("initiatePaymentSession error:", error)
    console.error("Error type:", typeof error)
    console.error("Error message:", error?.message)
    console.error("Error stack:", error?.stack)
    const cartId = typeof cart === "string" ? cart : cart?.id
    console.error("Cart ID:", cartId)
    if (typeof cart !== "string") {
      console.error("Cart region_id:", cart?.region_id)
    }
    console.error("Provider ID:", data.provider_id)
    if (error?.config) {
      console.error("Request URL:", error.config.url)
      console.error("Request method:", error.config.method)
    }
    throw medusaError(error)
  }
}

export async function applyPromotions(codes: string[]) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found")
  }

  if (!codes || codes.length === 0) {
    console.log("No promotion codes to apply")
    return
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  // 使用专门的 promotions 端点
  // SDK 会自动处理 JSON 序列化，不需要手动 JSON.stringify
  return sdk.client
    .fetch(`/store/carts/${cartId}/promotions`, {
      method: "POST",
      headers,
      body: {
        promo_codes: codes,
      },
    })
    .then(async (response: any) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch((error) => {
      console.error("Error applying promotions:", error)
      medusaError(error)
    })
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

    console.log("Creating single-use promotion for bundle:", bundleId)

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

    console.log("Created promotion:", response)

    // 注意：不在这里应用 Promotion，因为此时购物车中还没有产品
    // Promotion 将在所有产品添加到购物车后应用

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)

    return response
  } catch (error) {
    console.error("Error creating bundle promotion:", error)
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
      console.log("No cart ID found for syncing bundle promotions")
      return
    }

    const headers = {
      ...(await getAuthHeaders()),
    }

    console.log("Syncing bundle promotions for cart:", cartId)

    // 调用后端 API 获取需要应用/移除的 Promotion
    const response = await sdk.client.fetch<{
      promotionsToApply: string[]
      promotionsToRemove: string[]
      updatedPromotionCodes: string[]
    }>(`/store/carts/${cartId}/sync-bundle-promotions`, {
      method: "POST",
      headers,
    })

    console.log("Sync bundle promotions response:", response)

    // 应用更新后的 Promotion codes
    if (response.updatedPromotionCodes && response.updatedPromotionCodes.length > 0) {
      console.log("Applying promotion codes:", response.updatedPromotionCodes)
      await applyPromotions(response.updatedPromotionCodes)
    } else {
      console.log("No promotion codes to apply")
    }

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)

    const fulfillmentCacheTag = await getCacheTag("fulfillment")
    revalidateTag(fulfillmentCacheTag)
  } catch (error) {
    console.error("Error syncing bundle promotions:", error)
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

  redirect(`/checkout?step=delivery`)
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

  const cartRes = await sdk.store.cart
    .complete(id, {}, headers)
    .then(async (cartRes) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      return cartRes
    })
    .catch(medusaError)

  if (cartRes?.type === "order") {
    const orderCacheTag = await getCacheTag("orders")
    revalidateTag(orderCacheTag)

    removeCartId()
    redirect(`/order/${cartRes?.order.id}/confirmed`)
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
