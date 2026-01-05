import { NextRequest, NextResponse } from "next/server"
import {
  rateLimit,
  getClientIdentifier,
  RATE_LIMITS,
} from "@lib/util/rate-limiter"

/**
 * POST /api/newsletter
 * 处理邮箱订阅请求
 */
export async function POST(request: NextRequest) {
  // 速率限制检查
  const clientId = getClientIdentifier(request)
  const rateLimitResult = rateLimit(
    `newsletter:${clientId}`,
    RATE_LIMITS.NEWSLETTER
  )

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
          "Retry-After": Math.ceil(
            (rateLimitResult.resetAt - Date.now()) / 1000
          ).toString(),
        },
      }
    )
  }

  try {
    const formData = await request.formData()
    const email = formData.get("email") as string

    // 验证邮箱格式
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      )
    }

    // TODO: 这里应该将邮箱保存到数据库或发送到邮件服务
    // 例如：保存到 Medusa 的客户数据库或第三方邮件服务（如 Mailchimp、SendGrid）

    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: "Subscription successful",
    })
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Newsletter subscription error:", error?.message)
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * 验证邮箱格式
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

