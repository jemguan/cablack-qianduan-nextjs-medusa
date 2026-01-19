/**
 * 客户相关工具函数
 */

import { getMedusaBackendUrl, getLatestTokenFromStorage } from "./token"

interface CustomerCheckResult {
  valid: boolean
  customer?: any
  deleted?: boolean
}

/**
 * 验证客户 token 是否有效
 */
export async function verifyCustomerToken(
  token?: string | null
): Promise<CustomerCheckResult> {
  const baseUrl = getMedusaBackendUrl()
  const currentToken = token || getLatestTokenFromStorage()
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  if (!currentToken) {
    return { valid: false }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${currentToken}`,
  }

  if (publishableKey) {
    headers["x-publishable-api-key"] = publishableKey
  }

  try {
    const response = await fetch(`${baseUrl}/store/customers/me`, {
      method: "GET",
      headers,
    })

    if (response.ok) {
      const data = await response.json()
      if (data?.customer) {
        return { valid: true, customer: data.customer }
      }
    } else if (response.status === 404) {
      // 检查是否是客户被删除的情况
      try {
        const errorData = await response.json()
        console.log("[OAuth Callback] 404 response data:", errorData)
        if (errorData?.deleted === true) {
          return { valid: false, deleted: true }
        }
      } catch (parseError) {
        console.warn(
          "[OAuth Callback] Failed to parse 404 response:",
          parseError
        )
      }
    }
  } catch (error) {
    console.warn("Failed to verify customer:", error)
  }

  return { valid: false }
}

/**
 * 处理客户被删除的情况
 * 返回 true 表示应该终止当前流程
 */
export async function handleDeletedCustomer(
  setError: (error: string) => void,
  setLoading: (loading: boolean) => void,
  isMountedRef: { current: boolean },
  clearTokensFn: () => Promise<void>
): Promise<boolean> {
  console.warn(
    "[OAuth Callback] Customer was deleted, clearing token and re-authenticating"
  )
  await clearTokensFn()

  // 检查是否已经尝试过重新登录，避免死循环
  const reauthCount = parseInt(
    sessionStorage.getItem("medusa_reauth_count") || "0"
  )
  if (reauthCount >= 2) {
    console.error("[OAuth Callback] Re-authentication loop detected")
    if (isMountedRef.current) {
      setError(
        "Your account was deleted and we couldn't recreate it automatically after multiple attempts. Please try logging out and logging in again manually."
      )
      setLoading(false)
    }
    sessionStorage.removeItem("medusa_reauth_count")
    return true
  }
  sessionStorage.setItem("medusa_reauth_count", (reauthCount + 1).toString())

  // 使用 replace 重新触发 OAuth 登录
  window.location.replace("/auth/customer/google?prompt=select_account")
  return true
}

/**
 * 解析 Google 用户名字
 */
export function parseGoogleUserName(userMetadata: Record<string, unknown>): {
  firstName: string
  lastName: string
} {
  const fullName = (userMetadata.name as string) || ""
  const givenName = (userMetadata.given_name as string) || ""
  const familyName = (userMetadata.family_name as string) || ""

  let firstName = givenName
  let lastName = familyName

  if (!firstName && !lastName && fullName) {
    const nameParts = fullName.trim().split(" ")
    firstName = nameParts[0] || ""
    lastName = nameParts.slice(1).join(" ") || ""
  }

  return { firstName, lastName }
}
