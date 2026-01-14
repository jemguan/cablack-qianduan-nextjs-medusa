"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { verifyEmail } from "@lib/data/customer"
import { useState, useEffect, useMemo } from "react"

const VerifyEmail = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isVerifying, setIsVerifying] = useState(true)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const token = useMemo(() => {
    return searchParams?.get("token")
  }, [searchParams])

  const email = useMemo(() => {
    return searchParams?.get("email")
  }, [searchParams])

  useEffect(() => {
    // 如果没有 token 或 email，不执行验证
    if (!token || !email) {
      setResult({
        success: false,
        message: "Invalid verification link. Missing token or email.",
      })
      setIsVerifying(false)
      return
    }

    // 执行验证
    const performVerification = async () => {
      try {
        const verificationResult = await verifyEmail(token, email)
        setResult(verificationResult)
      } catch (error: any) {
        setResult({
          success: false,
          message: error?.message || "Failed to verify email",
        })
      } finally {
        setIsVerifying(false)
      }
    }

    performVerification()
  }, [token, email])

  // 验证成功后的重定向
  useEffect(() => {
    if (result?.success) {
      // 3秒后重定向到登录页面
      const timer = setTimeout(() => {
        router.push("/account")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [result, router])

  // 如果没有 token 或 email，显示错误
  if (!token || !email) {
    return (
      <div
        className="max-w-sm w-full flex flex-col items-center"
        data-testid="verify-email-page"
      >
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
      <div
        className="max-w-sm w-full flex flex-col items-center"
        data-testid="verify-email-page"
      >
        <h1 className="text-large-semi uppercase mb-6">Verifying your email</h1>
        <p className="text-center text-base-regular text-ui-fg-base mb-8">
          Please wait while we verify your email address...
        </p>
      </div>
    )
  }

  // 验证成功
  if (result?.success) {
    return (
      <div
        className="max-w-sm w-full flex flex-col items-center"
        data-testid="verify-email-page"
      >
        <h1 className="text-large-semi uppercase mb-6 text-ui-fg-success">Email verified!</h1>
        <p className="text-center text-base-regular text-ui-fg-base mb-8">
          {result.message || "Your email has been successfully verified."}
        </p>
        <p className="text-center text-small-regular text-ui-fg-muted">
          Redirecting to login page...
        </p>
      </div>
    )
  }

  // 验证失败
  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="verify-email-page"
    >
      <h1 className="text-large-semi uppercase mb-6 text-ui-fg-error">Verification failed</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        {result?.message || "Failed to verify your email address."}
      </p>
      <p className="text-center text-small-regular text-ui-fg-muted mb-4">
        The verification link may be invalid or expired.
      </p>
      <p className="text-center text-small-regular text-ui-fg-muted">
        Please check your email for a new verification link or contact support.
      </p>
    </div>
  )
}

export default VerifyEmail
