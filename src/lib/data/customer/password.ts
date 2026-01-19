"use server"

import { sdk } from "@lib/config"

/**
 * 请求重置密码
 * 发送密码重置请求到 Medusa，会触发邮件发送
 */
export async function requestPasswordReset(
  _currentState: unknown,
  formData: FormData
): Promise<string | null> {
  const email = formData.get("email") as string

  if (!email) {
    return "Email is required"
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address"
  }

  try {
    // 调用 Medusa SDK 的 resetPassword 方法
    // 这会发送 POST 请求到 /auth/customer/emailpass/reset-password
    // 后端会触发 auth.password_reset 事件，订阅者会发送邮件
    await sdk.auth.resetPassword("customer", "emailpass", {
      identifier: email,
    })

    // 即使邮箱不存在，也返回成功消息（防止邮箱枚举攻击）
    return null
  } catch (error: any) {
    // 记录错误但不暴露给用户（防止邮箱枚举）
    if (process.env.NODE_ENV === "development") {
      console.error("[Password Reset] Error requesting password reset:", error)
    }

    // 即使出错也返回成功消息，防止邮箱枚举
    return null
  }
}

/**
 * 重置密码
 * 使用重置令牌更新客户密码
 */
export async function resetPassword(
  _currentState: unknown,
  formData: FormData
): Promise<string | null> {
  const token = formData.get("token") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirm_password") as string

  if (!token) {
    return "Reset token is required"
  }

  if (!email) {
    return "Email is required"
  }

  if (!password) {
    return "Password is required"
  }

  if (password !== confirmPassword) {
    return "Passwords do not match"
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters long"
  }

  try {
    // 调用 Medusa SDK 的 updateProvider 方法
    // token 作为第三个参数传递（会在 Authorization header 中使用）
    await sdk.auth.updateProvider("customer", "emailpass", {
      email: email,
      password: password,
    }, token)

    return null
  } catch (error: any) {
    // 处理错误
    const errorMessage = error?.message || error?.toString() || "Failed to reset password"

    // 检查是否是令牌无效或过期
    if (errorMessage.includes("token") || errorMessage.includes("invalid") || errorMessage.includes("expired")) {
      return "Invalid or expired reset token. Please request a new password reset."
    }

    return errorMessage
  }
}
