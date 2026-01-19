"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { verifyEmail, resendVerificationEmail } from "@lib/data/customer"
import { useState, useEffect, useMemo, useCallback } from "react"

const MAX_RETRIES = 3
const RETRY_DELAY = 2000 // 2秒

const VerifyEmail = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isVerifying, setIsVerifying] = useState(true)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isResending, setIsResending] = useState(false)
  const [resendResult, setResendResult] = useState<{ success: boolean; message: string } | null>(null)

  const token = useMemo(() => searchParams?.get("token"), [searchParams])
  const email = useMemo(() => searchParams?.get("email"), [searchParams])

  // 验证函数 - 支持自动重试
  const performVerification = useCallback(async (attempt: number = 0) => {
    if (!token || !email) return

    try {
      const verificationResult = await verifyEmail(token, email)

      if (verificationResult.success) {
        setResult(verificationResult)
        setIsVerifying(false)
      } else {
        // 验证失败，检查是否应该重试
        // 对于 "No verification token found" 错误，可能是数据同步延迟，值得重试
        const shouldRetry =
          attempt < MAX_RETRIES &&
          (verificationResult.message.includes("No verification token found") ||
            verificationResult.message.includes("Invalid verification token"))

        if (shouldRetry) {
          setRetryCount(attempt + 1)
          // 等待后重试
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
          return performVerification(attempt + 1)
        } else {
          setResult(verificationResult)
          setIsVerifying(false)
        }
      }
    } catch (error: any) {
      if (attempt < MAX_RETRIES) {
        setRetryCount(attempt + 1)
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
        return performVerification(attempt + 1)
      }
      setResult({
        success: false,
        message: error?.message || "Failed to verify email",
      })
      setIsVerifying(false)
    }
  }, [token, email])

  // 重新发送验证邮件
  const handleResendEmail = async () => {
    setIsResending(true)
    setResendResult(null)
    try {
      const result = await resendVerificationEmail()
      setResendResult(result)
    } catch (error: any) {
      setResendResult({
        success: false,
        message: error?.message || "Failed to resend verification email",
      })
    } finally {
      setIsResending(false)
    }
  }

  // 手动重试验证
  const handleRetryVerification = () => {
    setIsVerifying(true)
    setResult(null)
    setRetryCount(0)
    performVerification(0)
  }

  useEffect(() => {
    if (!token || !email) {
      setResult({
        success: false,
        message: "Invalid verification link. Missing token or email.",
      })
      setIsVerifying(false)
      return
    }

    performVerification(0)
  }, [token, email, performVerification])

  // 验证成功后重定向
  useEffect(() => {
    if (result?.success) {
      const timer = setTimeout(() => {
        router.push("/account")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [result, router])

  // 无效链接
  if (!token || !email) {
    return (
      <div className="max-w-sm w-full flex flex-col items-center" data-testid="verify-email-page">
        <h1 className="text-large-semi uppercase mb-6">Invalid verification link</h1>
        <p className="text-center text-base-regular text-ui-fg-base mb-8">
          The verification link is invalid or missing required parameters.
        </p>
        <p className="text-center text-small-regular text-ui-fg-muted">
          Please check your email for a valid verification link.
        </p>
      </div>
    )
  }

  // 正在验证
  if (isVerifying) {
    return (
      <div className="max-w-sm w-full flex flex-col items-center" data-testid="verify-email-page">
        <h1 className="text-large-semi uppercase mb-6">Verifying your email</h1>
        <p className="text-center text-base-regular text-ui-fg-base mb-4">
          Please wait while we verify your email address...
        </p>
        {retryCount > 0 && (
          <p className="text-center text-small-regular text-ui-fg-muted">
            Retry attempt {retryCount}/{MAX_RETRIES}...
          </p>
        )}
      </div>
    )
  }

  // 验证成功
  if (result?.success) {
    return (
      <div className="max-w-sm w-full flex flex-col items-center" data-testid="verify-email-page">
        <h1 className="text-large-semi uppercase mb-6 text-green-600">Email verified!</h1>
        <p className="text-center text-base-regular text-ui-fg-base mb-8">
          {result.message || "Your email has been successfully verified."}
        </p>
        <p className="text-center text-small-regular text-ui-fg-muted">
          Redirecting to your account...
        </p>
      </div>
    )
  }

  // 验证失败
  return (
    <div className="max-w-sm w-full flex flex-col items-center" data-testid="verify-email-page">
      <h1 className="text-large-semi uppercase mb-6 text-red-600">Verification failed</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-4">
        {result?.message || "Failed to verify your email address."}
      </p>
      <p className="text-center text-small-regular text-ui-fg-muted mb-6">
        The verification link may be invalid or expired.
      </p>

      <div className="flex flex-col gap-3 w-full">
        {/* 重试验证按钮 */}
        <button
          onClick={handleRetryVerification}
          className="w-full py-2 px-4 bg-ui-bg-interactive text-ui-fg-on-color rounded hover:bg-ui-bg-interactive-hover transition-colors"
        >
          Try Again
        </button>

        {/* 重新发送验证邮件按钮 */}
        <button
          onClick={handleResendEmail}
          disabled={isResending}
          className="w-full py-2 px-4 border border-ui-border-base text-ui-fg-base rounded hover:bg-ui-bg-subtle transition-colors disabled:opacity-50"
        >
          {isResending ? "Sending..." : "Request New Verification Email"}
        </button>
      </div>

      {/* 重新发送结果 */}
      {resendResult && (
        <p
          className={`text-center text-small-regular mt-4 ${
            resendResult.success ? "text-green-600" : "text-red-600"
          }`}
        >
          {resendResult.message}
        </p>
      )}

      <p className="text-center text-small-regular text-ui-fg-muted mt-6">
        If the problem persists, please contact support.
      </p>
    </div>
  )
}

export default VerifyEmail
