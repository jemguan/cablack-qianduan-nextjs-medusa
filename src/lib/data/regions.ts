"use server"

import { sdk } from "@lib/config"
import { getCacheConfig } from "@lib/config/cache"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions, getRegionCountryCode } from "./cookies"

export const listRegions = async () => {
  // 获取缓存标签
  const cacheOptions = await getCacheOptions("regions")
  
  // 获取缓存策略
  const cacheConfig = getCacheConfig("REGION")

  // 合并 tags 和 revalidate 到 next 对象
  const next = {
    ...cacheOptions,
    ...(cacheConfig && 'next' in cacheConfig ? cacheConfig.next : {}),
  }

  return sdk.client
    .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
      method: "GET",
      next,
    })
    .then(({ regions }) => regions)
    .catch(medusaError)
}

export const retrieveRegion = async (id: string) => {
  // 获取缓存标签
  const cacheOptions = await getCacheOptions(["regions", id].join("-"))
  
  // 获取缓存策略
  const cacheConfig = getCacheConfig("REGION")

  // 合并 tags 和 revalidate 到 next 对象
  const next = {
    ...cacheOptions,
    ...(cacheConfig && 'next' in cacheConfig ? cacheConfig.next : {}),
  }

  return sdk.client
    .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
      method: "GET",
      next,
    })
    .then(({ region }) => region)
    .catch(medusaError)
}

const regionMap = new Map<string, HttpTypes.StoreRegion>()

export const getRegion = async (countryCode: string) => {
  try {
    if (regionMap.has(countryCode)) {
      return regionMap.get(countryCode)
    }

    const regions = await listRegions()

    if (!regions) {
      return null
    }

    regions.forEach((region) => {
      region.countries?.forEach((c) => {
        regionMap.set(c?.iso_2 ?? "", region)
      })
    })

    const region = countryCode
      ? regionMap.get(countryCode)
      : regionMap.get("ca")

    return region
  } catch (e: any) {
    return null
  }
}

/**
 * Get the current region based on the country code stored in cookie.
 * This is a convenience function that gets the countryCode from cookie
 * and returns the corresponding region.
 */
export const getCurrentRegion = async () => {
  const countryCode = await getRegionCountryCode()
  return getRegion(countryCode)
}

/**
 * Get the current country code from cookie.
 * Wrapper function for use in server actions (re-export not allowed in "use server" files).
 */
export const getCountryCode = async (): Promise<string> => {
  return getRegionCountryCode()
}
