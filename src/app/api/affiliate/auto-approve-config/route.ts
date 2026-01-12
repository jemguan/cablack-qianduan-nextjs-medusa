import { NextRequest, NextResponse } from "next/server"

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
 * GET /api/affiliate/auto-approve-config
 * 代理请求到后端的 /store/affiliate/auto-approve-config API
 */
export async function GET(request: NextRequest) {
  try {
    const headers = getCommonHeaders()

    const response = await fetch(`${BACKEND_URL}/store/affiliate/auto-approve-config`, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    if (!response.ok) {
      // 如果失败，返回默认值 0
      return NextResponse.json({ auto_approve_days: 0 })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[Auto Approve Config API] Error:", error)
    return NextResponse.json(
      { auto_approve_days: 0 },
      { status: 200 } // 即使出错也返回 200，使用默认值
    )
  }
}
