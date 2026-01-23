"use server"

import { sdk } from "@lib/config"
import { getCacheConfig } from "@lib/config/cache"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions, getRegionCountryCode } from "./cookies"
import { cache } from "react"
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from "./redis"

/**
 * 内部实现：从 API 获取所有区域
 */
const _fetchRegionsFromApi = async () => {
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

/**
 * 内部实现：获取所有区域（优先 Redis，降级到 API）
 */
const _listRegionsInternal = async () => {
  // 1. 先尝试从 Redis 获取
  const cached = await getCache<HttpTypes.StoreRegion[]>(CACHE_KEYS.REGION_LIST)
  if (cached) {
    return cached
  }

  // 2. Redis 没有或不可用，走原有逻辑
  const regions = await _fetchRegionsFromApi()

  // 3. 写入 Redis（如果可用）
  if (regions) {
    await setCache(CACHE_KEYS.REGION_LIST, regions, CACHE_TTL.EXTRA_LONG)
  }

  return regions
}

/**
 * 获取所有区域
 * 使用 React cache() 在单次渲染周期内去重请求
 */
export const listRegions = cache(_listRegionsInternal)

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

// 内存缓存作为二级降级
const regionMap = new Map<string, HttpTypes.StoreRegion>()

export const getRegion = async (countryCode: string) => {
  try {
    // 1. 先检查内存缓存
    if (regionMap.has(countryCode)) {
      return regionMap.get(countryCode)
    }

    // 2. 尝试从 Redis 获取 country -> region 映射
    const redisKey = `${CACHE_KEYS.REGION_MAP}:${countryCode}`
    const cachedRegion = await getCache<HttpTypes.StoreRegion>(redisKey)
    if (cachedRegion) {
      regionMap.set(countryCode, cachedRegion)
      return cachedRegion
    }

    // 3. 从 API 获取所有区域并构建映射
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

    // 4. 写入 Redis（如果可用）
    if (region) {
      await setCache(redisKey, region, CACHE_TTL.EXTRA_LONG)
    }

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
