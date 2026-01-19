"use server"

import { revalidateTag } from "next/cache"
import { getCacheTag } from "../cookies"

/**
 * 失效产品库存相关的缓存
 * 在库存变化时调用（添加商品、更新数量、删除商品、下单等）
 */
export async function revalidateProductInventoryCache() {
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
 * 失效购物车相关的缓存
 */
export async function revalidateCartCache() {
  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)
}

/**
 * 失效配送相关的缓存
 */
export async function revalidateFulfillmentCache() {
  const fulfillmentCacheTag = await getCacheTag("fulfillment")
  revalidateTag(fulfillmentCacheTag)
}

/**
 * 失效购物车和配送缓存
 */
export async function revalidateCartAndFulfillmentCache() {
  await revalidateCartCache()
  await revalidateFulfillmentCache()
}
