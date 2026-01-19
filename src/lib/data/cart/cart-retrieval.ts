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
  getCartId,
  setCartId,
} from "../cookies"
import { getRegion } from "../regions"
import { revalidateCartCache, revalidateCartAndFulfillmentCache } from "./cart-cache"

/**
 * 内部实现：获取购物车
 */
const _retrieveCartInternal = async (cartId?: string, fields?: string): Promise<HttpTypes.StoreCart | null> => {
  const id = cartId || (await getCartId())
  fields ??= "*items, *region, *items.product, *items.variant, *items.variant.images, *items.thumbnail, *items.metadata, +items.total, +items.unit_price, *promotions, +shipping_methods.name, +discount_total, +discount_subtotal, +item_subtotal, +item_total, +subtotal, +total, +tax_total, +shipping_subtotal, +shipping_total"

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

/**
 * 获取或创建购物车
 * 如果购物车不存在，则创建一个新的购物车
 * 如果购物车的 region 不匹配，则更新 region
 */
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

    await revalidateCartCache()
  }

  if (cart && cart?.region_id !== region.id) {
    await sdk.store.cart.update(cart.id, { region_id: region.id }, {}, headers)
    await revalidateCartCache()
  }

  return cart
}

/**
 * 更新购物车
 */
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
      await revalidateCartAndFulfillmentCache()
      return cart
    })
    .catch(medusaError)
}
