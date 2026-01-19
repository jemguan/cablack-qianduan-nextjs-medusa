"use server"

import { revalidateTag } from "next/cache"
import { getCartId, getCacheTag, setRegionCountryCode } from "../cookies"
import { getRegion } from "../regions"
import { updateCart } from "./cart-retrieval"
import { revalidateCartCache } from "./cart-cache"

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
    await revalidateCartCache()
  }

  // Revalidate caches
  const regionCacheTag = await getCacheTag("regions")
  revalidateTag(regionCacheTag)

  const productsCacheTag = await getCacheTag("products")
  revalidateTag(productsCacheTag)
}
