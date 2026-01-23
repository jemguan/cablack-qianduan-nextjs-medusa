import "server-only"
import { cookies as nextCookies } from "next/headers"
import { invalidateRegionCache } from "./redis"

export const getAuthHeaders = async (): Promise<
  { authorization: string } | {}
> => {
  try {
    const cookies = await nextCookies()
    const token = cookies.get("_medusa_jwt")?.value

    if (!token) {
      return {}
    }

    return { authorization: `Bearer ${token}` }
  } catch {
    return {}
  }
}

export const getCacheTag = async (tag: string): Promise<string> => {
  try {
    const cookies = await nextCookies()
    const cacheId = cookies.get("_medusa_cache_id")?.value

    if (!cacheId) {
      return ""
    }

    return `${tag}-${cacheId}`
  } catch (error) {
    return ""
  }
}

export const getCacheOptions = async (
  tag: string
): Promise<{ tags: string[] } | {}> => {
  if (typeof window !== "undefined") {
    return {}
  }

  const cacheTag = await getCacheTag(tag)

  if (!cacheTag) {
    return {}
  }

  return { tags: [`${cacheTag}`] }
}

export const setAuthToken = async (token: string) => {
  const cookies = await nextCookies()
  cookies.set("_medusa_jwt", token, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "lax", // 改为 lax 以确保重定向后 cookie 可用
    secure: process.env.NODE_ENV === "production",
    path: "/", // 确保 cookie 在所有路径可用
  })
}

export const removeAuthToken = async () => {
  const cookies = await nextCookies()
  cookies.set("_medusa_jwt", "", {
    maxAge: -1,
  })
}

export const getCartId = async () => {
  const cookies = await nextCookies()
  return cookies.get("_medusa_cart_id")?.value
}

/**
 * 检查是否有 auth token（不验证有效性，仅检查存在性）
 * 用于条件性获取用户数据，减少不必要的 API 调用
 */
export const hasAuthToken = async (): Promise<boolean> => {
  try {
    const cookies = await nextCookies()
    return !!cookies.get("_medusa_jwt")?.value
  } catch {
    return false
  }
}

/**
 * 检查是否有 cart ID（不验证有效性，仅检查存在性）
 * 用于条件性获取购物车数据，减少不必要的 API 调用
 */
export const hasCartId = async (): Promise<boolean> => {
  try {
    const cookies = await nextCookies()
    return !!cookies.get("_medusa_cart_id")?.value
  } catch {
    return false
  }
}

export const setCartId = async (cartId: string) => {
  const cookies = await nextCookies()
  cookies.set("_medusa_cart_id", cartId, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeCartId = async () => {
  const cookies = await nextCookies()
  cookies.set("_medusa_cart_id", "", {
    maxAge: -1,
  })
}

// Default region country code
const DEFAULT_REGION = "ca"

export const getRegionCountryCode = async (): Promise<string> => {
  try {
    const cookies = await nextCookies()
    return cookies.get("_medusa_region")?.value || DEFAULT_REGION
  } catch {
    return DEFAULT_REGION
  }
}

export const setRegionCountryCode = async (countryCode: string) => {
  const cookies = await nextCookies()
  const currentRegion = cookies.get("_medusa_region")?.value

  // 只有当区域真的变化时才设置 cookie 和清除缓存
  if (currentRegion !== countryCode.toLowerCase()) {
    cookies.set("_medusa_region", countryCode.toLowerCase(), {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false, // Client needs to read this
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    // 清除区域相关的 Redis 缓存
    await invalidateRegionCache()
  }
}
