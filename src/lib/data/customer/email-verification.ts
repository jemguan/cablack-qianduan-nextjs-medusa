"use server"

import { getAuthHeaders } from "../cookies"

/**
 * 验证邮箱
 * 使用验证令牌验证客户邮箱
 */
export async function verifyEmail(
  token: string,
  email: string
): Promise<{ success: boolean; message: string }> {
  if (!token) {
    return { success: false, message: "Verification token is required" }
  }

  if (!email) {
    return { success: false, message: "Email is required" }
  }

  try {
    const baseUrl = process.env.MEDUSA_BACKEND_URL ||
                   process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
                   "http://localhost:9000"

    // 准备请求头，包含 publishable key
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
    if (publishableKey) {
      headers["x-publishable-api-key"] = publishableKey
    }

    const response = await fetch(`${baseUrl}/store/customers/verify-email`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        token,
        email,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to verify email",
      }
    }

    return {
      success: true,
      message: data.message || "Email verified successfully",
    }
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to verify email",
    }
  }
}

/**
 * 获取邮箱验证状态
 */
export async function getEmailVerificationStatus(): Promise<{
  email_verified: boolean
  has_verification_token: boolean
  verification_token_expires_at: string | null
}> {
  try {
    const baseUrl = process.env.MEDUSA_BACKEND_URL ||
                   process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
                   "http://localhost:9000"

    const headers = await getAuthHeaders()
    if (!("authorization" in headers)) {
      return {
        email_verified: false,
        has_verification_token: false,
        verification_token_expires_at: null,
      }
    }

    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
    const requestHeaders: Record<string, string> = {
      ...headers,
      "Content-Type": "application/json",
    }
    if (publishableKey) {
      requestHeaders["x-publishable-api-key"] = publishableKey
    }

    const response = await fetch(`${baseUrl}/store/customers/email-verification-status`, {
      method: "GET",
      headers: requestHeaders,
    })

    if (!response.ok) {
      return {
        email_verified: false,
        has_verification_token: false,
        verification_token_expires_at: null,
      }
    }

    return await response.json()
  } catch (error: any) {
    return {
      email_verified: false,
      has_verification_token: false,
      verification_token_expires_at: null,
    }
  }
}

/**
 * 重新发送验证邮件
 */
export async function resendVerificationEmail(): Promise<{
  success: boolean
  message: string
}> {
  try {
    const baseUrl = process.env.MEDUSA_BACKEND_URL ||
                   process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
                   "http://localhost:9000"

    const headers = await getAuthHeaders()
    if (!("authorization" in headers)) {
      return {
        success: false,
        message: "Authentication required",
      }
    }

    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
    const requestHeaders: Record<string, string> = {
      ...headers,
      "Content-Type": "application/json",
    }
    if (publishableKey) {
      requestHeaders["x-publishable-api-key"] = publishableKey
    }

    const response = await fetch(`${baseUrl}/store/customers/resend-verification-email`, {
      method: "POST",
      headers: requestHeaders,
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to resend verification email",
      }
    }

    return {
      success: true,
      message: data.message || "Verification email sent successfully",
    }
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to resend verification email",
    }
  }
}
