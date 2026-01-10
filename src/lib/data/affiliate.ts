import { getAuthHeaders } from "./cookies"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 
                    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 
                    "http://localhost:9000"

function getCommonHeaders() {
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (publishableKey) {
    headers["x-publishable-api-key"] = publishableKey
  }
  return headers
}

/**
 * 检查当前用户是否是 Affiliate
 */
export async function checkIsAffiliate(): Promise<boolean> {
  try {
    const authHeaders = await getAuthHeaders()
    const response = await fetch(`${BACKEND_URL}/store/affiliate/me`, {
      headers: {
        ...getCommonHeaders(),
        ...authHeaders,
      },
      cache: "no-store",
    })
    
    if (!response.ok) {
      return false
    }
    
    const data = await response.json()
    return !!data?.affiliate
  } catch (error) {
    console.error("[Affiliate] Error checking affiliate status:", error)
    return false
  }
}

/**
 * 获取 Affiliate 数据
 */
export async function getAffiliateData() {
  try {
    const authHeaders = await getAuthHeaders()
    const response = await fetch(`${BACKEND_URL}/store/affiliate/me`, {
      headers: {
        ...getCommonHeaders(),
        ...authHeaders,
      },
      cache: "no-store",
    })
    
    if (!response.ok) {
      return null
    }
    
    return response.json()
  } catch (error) {
    console.error("[Affiliate] Error fetching affiliate data:", error)
    return null
  }
}

/**
 * 获取 Affiliate 统计数据
 */
export async function getAffiliateStats() {
  try {
    const authHeaders = await getAuthHeaders()
    const response = await fetch(`${BACKEND_URL}/store/affiliate/stats`, {
      headers: {
        ...getCommonHeaders(),
        ...authHeaders,
      },
      cache: "no-store",
    })
    
    if (!response.ok) {
      return null
    }
    
    return response.json()
  } catch (error) {
    console.error("[Affiliate] Error fetching affiliate stats:", error)
    return null
  }
}
