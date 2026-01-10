"use client"

const AFFILIATE_CODE_KEY = "affiliate_code"
const AFFILIATE_PARAMS_KEY = "affiliate_params" // 保存完整的 affiliate 参数
const AFFILIATE_CODE_COOKIE = "_affiliate_code"
const AFFILIATE_CODE_EXPIRY_DAYS = 30

export type AffiliateParams = {
  ref: string
  tid?: string
  utm_source?: string
}

/**
 * 从 URL 参数中获取 Affiliate Code
 */
export function getAffiliateCodeFromUrl(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get("ref") || null
}

/**
 * 从 URL 参数中获取完整的 Affiliate 参数
 */
export function getAffiliateParamsFromUrl(): AffiliateParams | null {
  if (typeof window === "undefined") {
    return null
  }

  const urlParams = new URLSearchParams(window.location.search)
  const ref = urlParams.get("ref")
  
  if (!ref) return null

  return {
    ref,
    tid: urlParams.get("tid") || undefined,
    utm_source: urlParams.get("utm_source") || undefined,
  }
}

/**
 * 从 localStorage 获取 Affiliate Code
 */
export function getAffiliateCodeFromStorage(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    return localStorage.getItem(AFFILIATE_CODE_KEY)
  } catch (error) {
    console.error("[Affiliate Tracking] Error reading from localStorage:", error)
    return null
  }
}

/**
 * 从 localStorage 获取完整的 Affiliate 参数
 */
export function getAffiliateParamsFromStorage(): AffiliateParams | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const stored = localStorage.getItem(AFFILIATE_PARAMS_KEY)
    if (stored) {
      return JSON.parse(stored) as AffiliateParams
    }
    
    // 回退：如果只有 code 没有完整参数
    const code = localStorage.getItem(AFFILIATE_CODE_KEY)
    if (code) {
      return { ref: code, utm_source: "affiliate" }
    }
    
    return null
  } catch (error) {
    console.error("[Affiliate Tracking] Error reading from localStorage:", error)
    return null
  }
}

/**
 * 从 Cookie 获取 Affiliate Code（服务端）
 */
export async function getAffiliateCodeFromCookie(): Promise<string | null> {
  if (typeof window !== "undefined") {
    // 客户端：从 document.cookie 读取
    const cookies = document.cookie.split(";")
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=")
      if (name === AFFILIATE_CODE_COOKIE) {
        return decodeURIComponent(value)
      }
    }
    return null
  }

  // 服务端：使用 next/headers
  try {
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    return cookieStore.get(AFFILIATE_CODE_COOKIE)?.value || null
  } catch (error) {
    return null
  }
}

/**
 * 获取 Affiliate Code（优先级：URL > localStorage > Cookie）
 */
export function getAffiliateCode(): string | null {
  // 1. 优先从 URL 参数读取
  const urlCode = getAffiliateCodeFromUrl()
  if (urlCode) {
    return urlCode
  }

  // 2. 从 localStorage 读取
  const storageCode = getAffiliateCodeFromStorage()
  if (storageCode) {
    return storageCode
  }

  // 3. 从 Cookie 读取（客户端同步版本）
  if (typeof window !== "undefined") {
    const cookies = document.cookie.split(";")
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=")
      if (name === AFFILIATE_CODE_COOKIE) {
        return decodeURIComponent(value)
      }
    }
  }

  return null
}

/**
 * 设置 Affiliate Code 到 localStorage 和 Cookie
 */
export function setAffiliateCode(code: string): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    // 存储到 localStorage
    localStorage.setItem(AFFILIATE_CODE_KEY, code)

    // 存储到 Cookie（客户端）
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + AFFILIATE_CODE_EXPIRY_DAYS)

    document.cookie = `${AFFILIATE_CODE_COOKIE}=${encodeURIComponent(code)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
  } catch (error) {
    console.error("[Affiliate Tracking] Error setting affiliate code:", error)
  }
}

/**
 * 设置完整的 Affiliate 参数到 localStorage
 */
export function setAffiliateParams(params: AffiliateParams): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    // 存储完整参数到 localStorage
    localStorage.setItem(AFFILIATE_PARAMS_KEY, JSON.stringify(params))
    
    // 同时存储 code（兼容性）
    localStorage.setItem(AFFILIATE_CODE_KEY, params.ref)

    // 存储到 Cookie（客户端）
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + AFFILIATE_CODE_EXPIRY_DAYS)

    document.cookie = `${AFFILIATE_CODE_COOKIE}=${encodeURIComponent(params.ref)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
  } catch (error) {
    console.error("[Affiliate Tracking] Error setting affiliate params:", error)
  }
}

/**
 * 清除 Affiliate Code
 */
export function clearAffiliateCode(): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    // 清除 localStorage
    localStorage.removeItem(AFFILIATE_CODE_KEY)
    localStorage.removeItem(AFFILIATE_PARAMS_KEY)

    // 清除 Cookie
    document.cookie = `${AFFILIATE_CODE_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  } catch (error) {
    console.error("[Affiliate Tracking] Error clearing affiliate code:", error)
  }
}

/**
 * 初始化 Affiliate 追踪
 * 检测 URL 参数并存储
 */
export function initAffiliateTracking(): void {
  if (typeof window === "undefined") {
    return
  }

  const urlParams = getAffiliateParamsFromUrl()
  if (urlParams) {
    setAffiliateParams(urlParams)
  }
}

/**
 * 构建带有 Affiliate 参数的 URL 查询字符串
 */
export function buildAffiliateQueryString(params: AffiliateParams): string {
  const searchParams = new URLSearchParams()
  searchParams.set("ref", params.ref)
  if (params.tid) {
    searchParams.set("tid", params.tid)
  }
  if (params.utm_source) {
    searchParams.set("utm_source", params.utm_source)
  }
  return searchParams.toString()
}
