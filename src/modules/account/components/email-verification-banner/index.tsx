"use client"

import { useState, useEffect } from "react"
import { getEmailVerificationStatus, resendVerificationEmail } from "@lib/data/customer"
import { FaEnvelope, FaCheckCircle, FaSpinner } from "react-icons/fa"

const EmailVerificationBanner = () => {
  const [status, setStatus] = useState<{
    email_verified: boolean
    has_verification_token: boolean
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const verificationStatus = await getEmailVerificationStatus()
        setStatus(verificationStatus)
      } catch (error) {
        console.error("Failed to check email verification status:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkStatus()

    // 定期检查验证状态（每30秒），以便在验证成功后自动更新
    const interval = setInterval(() => {
      checkStatus()
    }, 30000)

    // 监听页面可见性变化，当页面重新可见时检查状态
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkStatus()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  const handleResend = async () => {
    setIsSending(true)
    setMessage(null)

    try {
      const result = await resendVerificationEmail()
      if (result.success) {
        setMessage("Verification email sent! Please check your inbox.")
        // 重新检查状态
        const verificationStatus = await getEmailVerificationStatus()
        setStatus(verificationStatus)
      } else {
        setMessage(result.message || "Failed to send verification email")
      }
    } catch (error: any) {
      setMessage(error?.message || "Failed to send verification email")
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return null
  }

  // 如果已验证，不显示提醒
  if (status?.email_verified) {
    return null
  }

  return (
    <div className="w-full mb-6 p-4 bg-ui-bg-warning-subtle border border-ui-border-warning rounded-md">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <FaEnvelope className="w-5 h-5 text-ui-fg-warning" />
        </div>
        <div className="flex-1">
          <p className="text-base-regular text-ui-fg-warning mb-2 font-semibold">
            Please verify your email address
          </p>
          <p className="text-small-regular text-ui-fg-base mb-3">
            We've sent a verification email to your inbox. Please check your email and click the verification link to complete your account setup.
          </p>
          {message && (
            <div className={`mb-3 p-2 rounded text-small-regular ${
              message.includes("sent") || message.includes("success")
                ? "bg-ui-bg-success-subtle text-ui-fg-success"
                : "bg-ui-bg-error-subtle text-ui-fg-error"
            }`}>
              {message}
            </div>
          )}
          <button
            onClick={handleResend}
            disabled={isSending}
            className="px-4 py-2 bg-ui-button-primary text-ui-button-primary-text rounded-md hover:bg-ui-button-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
          >
            {isSending ? (
              <>
                <FaSpinner className="w-4 h-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <FaEnvelope className="w-4 h-4" />
                <span>Resend Verification Email</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EmailVerificationBanner
