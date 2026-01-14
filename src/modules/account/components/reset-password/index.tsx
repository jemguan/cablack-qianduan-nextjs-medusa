"use client"

import { useActionState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { resetPassword } from "@lib/data/customer"
import { useState, useEffect, useMemo, useRef } from "react"

const ResetPassword = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [message, formAction, isPending] = useActionState(resetPassword, null)
  const [success, setSuccess] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const token = useMemo(() => {
    return searchParams?.get("token")
  }, [searchParams])

  const email = useMemo(() => {
    return searchParams?.get("email")
  }, [searchParams])

  useEffect(() => {
    // 只有在表单提交后且没有错误消息时才显示成功消息
    if (hasSubmitted && !isPending && message === null) {
      setSuccess(true)
      // 3秒后重定向到登录页面
      setTimeout(() => {
        router.push("/account")
      }, 3000)
    }
  }, [hasSubmitted, isPending, message, router])

  const handleSubmit = async (formData: FormData) => {
    setHasSubmitted(true)
    return formAction(formData)
  }

  // 如果没有 token 或 email，显示错误
  if (!token || !email) {
    return (
      <div
        className="max-w-sm w-full flex flex-col items-center"
        data-testid="reset-password-page"
      >
        <h1 className="text-large-semi uppercase mb-6">Invalid reset link</h1>
        <p className="text-center text-base-regular text-ui-fg-base mb-8">
          The password reset link is invalid or missing required parameters.
        </p>
        <p className="text-center text-small-regular text-ui-fg-muted">
          Please request a new password reset link.
        </p>
      </div>
    )
  }

  if (success) {
    return (
      <div
        className="max-w-sm w-full flex flex-col items-center"
        data-testid="reset-password-page"
      >
        <h1 className="text-large-semi uppercase mb-6">Password reset successful</h1>
        <p className="text-center text-base-regular text-ui-fg-base mb-8">
          Your password has been successfully reset.
        </p>
        <p className="text-center text-small-regular text-ui-fg-muted">
          Redirecting to login page...
        </p>
      </div>
    )
  }

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="reset-password-page"
    >
      <h1 className="text-large-semi uppercase mb-6">Set new password</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        Enter your new password below.
      </p>
      <form ref={formRef} className="w-full" action={handleSubmit}>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="email" value={email} />
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            data-testid="password-input"
          />
          <Input
            label="Confirm password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            required
            data-testid="confirm-password-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="error-message" />
        <SubmitButton data-testid="submit-button" className="w-full mt-6" disabled={isPending}>
          {isPending ? "Resetting..." : "Reset password"}
        </SubmitButton>
      </form>
    </div>
  )
}

export default ResetPassword
