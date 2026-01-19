/**
 * Token 相关工具函数
 */

/**
 * 将 token 设置到服务端 cookie
 */
export async function setTokenToCookie(token: string): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/set-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
      credentials: "include",
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * 获取 Medusa 后端 URL
 */
export function getMedusaBackendUrl(): string {
  if (typeof window !== "undefined") {
    // 客户端：优先使用从 HTML 注入的 URL
    const windowUrl = (window as any).__MEDUSA_BACKEND_URL__
    const envUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL

    if (windowUrl && !windowUrl.includes("localhost")) {
      return windowUrl
    }

    if (envUrl && !envUrl.includes("localhost")) {
      return envUrl
    }

    if (windowUrl) {
      return windowUrl
    }

    return envUrl || "http://localhost:9000"
  }

  return process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
}

/**
 * 清除所有可能的 Medusa 认证 token
 */
export async function clearAllMedusaTokens(): Promise<void> {
  if (typeof window === "undefined") return

  console.warn("[Auth] Clearing all Medusa tokens and session data")

  // 1. 清除 localStorage 中的所有可能 key
  const keysToRemove = [
    "_medusa_jwt",
    "_medusa_refresh_token",
    "medusa_auth_token",
    "medusa_refresh_token",
    "medusa_jwt",
    "jwt",
    "refresh_token",
  ]

  // 遍历所有 key，清除包含 medusa 或 auth 的项
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (
      key &&
      (key.toLowerCase().includes("medusa") ||
        key.toLowerCase().includes("auth") ||
        key.toLowerCase().includes("jwt") ||
        key.toLowerCase().includes("token"))
    ) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach((key) => {
    try {
      localStorage.removeItem(key)
    } catch (e) {}
  })

  // 2. 清除服务端 cookie
  try {
    await fetch("/api/auth/clear-token", {
      method: "POST",
      credentials: "include",
    })
  } catch (e) {
    console.error("[Auth] Failed to clear server cookie:", e)
  }

  // 3. 给浏览器一点时间处理存储更新
  await new Promise((resolve) => setTimeout(resolve, 100))
}

/**
 * 从 localStorage 获取 JWT token
 * 注意：只查找精确的 JWT token key，避免匹配其他数据
 */
export function getLatestTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null

  // 精确匹配这些 key，不再使用模糊搜索
  const exactKeys = [
    "_medusa_jwt",
    "medusa_jwt",
    "medusa_token",
    "_medusa_access_token",
    "access_token",
    "auth_token",
    "jwt",
  ]

  for (const key of exactKeys) {
    const value = localStorage.getItem(key)
    // JWT token 通常以 "eyJ" 开头（Base64 编码的 "{" 开头的 JSON）
    if (value && value.startsWith("eyJ") && value.length > 50) {
      return value
    }
  }

  return null
}
