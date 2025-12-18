import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/newsletter
 * 处理邮箱订阅请求
 */
export async function POST(request: NextRequest) {
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
    console.log("Newsletter subscription:", email)

    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: "Subscription successful",
    })
  } catch (error) {
    console.error("Newsletter subscription error:", error)
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

