import { NextRequest, NextResponse } from "next/server"
import { getAuthHeaders } from "@lib/data/cookies"

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
 * GET /api/affiliate/payment-history
 * 代理请求到后端的 /store/affiliate/payment-history API
 * 服务端可以访问 httpOnly cookie，用于认证
 */
export async function GET(request: NextRequest) {
  try {
    const authHeaders = await getAuthHeaders()
    const headers = {
      ...getCommonHeaders(),
      ...authHeaders,
    }

    const response = await fetch(`${BACKEND_URL}/store/affiliate/payment-history`, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    if (!response.ok) {
      // 如果是 404（用户不是 Affiliate），返回空记录
      if (response.status === 404) {
        return NextResponse.json({
          payment_records: [],
          total_paid: 0,
          total_commissions: 0,
        })
      }
      
      // 如果是 401（未授权），也返回空记录
      if (response.status === 401) {
        return NextResponse.json({
          payment_records: [],
          total_paid: 0,
          total_commissions: 0,
        })
      }
      
      const errorData = await response.json().catch(() => ({
        message: "Failed to fetch payment history",
      }))
      
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch payment history" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[Affiliate Payment History API] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch payment history" },
      { status: 500 }
    )
  }
}
