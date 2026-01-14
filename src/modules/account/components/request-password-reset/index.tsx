"use client"

import { useActionState } from "react"
import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { requestPasswordReset } from "@lib/data/customer"
import { useState, useRef, useEffect } from "react"

const RequestPasswordReset = () => {
  const [message, formAction, isPending] = useActionState(requestPasswordReset, null)
  const [success, setSuccess] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    // 只有在表单提交后且没有错误消息时才显示成功消息
    if (hasSubmitted && !isPending && message === null) {
      setSuccess(true)
    }
  }, [isPending, message, hasSubmitted])

  const handleSubmit = async (formData: FormData) => {
    setHasSubmitted(true)
    return formAction(formData)
  }

  if (success) {
    return (
      <div
        className="max-w-sm w-full flex flex-col items-center"
        data-testid="request-password-reset-page"
      >
        <h1 className="text-large-semi uppercase mb-6">Check your email</h1>
        <p className="text-center text-base-regular text-ui-fg-base mb-8">
          If an account exists with the email you provided, you will receive instructions to reset your password.
        </p>
        <p className="text-center text-small-regular text-ui-fg-muted">
          Please check your inbox and follow the link in the email to reset your password.
        </p>
      </div>
    )
  }

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="request-password-reset-page"
    >
      <h1 className="text-large-semi uppercase mb-6">Reset your password</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        Enter your email address and we'll send you instructions to reset your password.
      </p>
      <form ref={formRef} className="w-full" action={handleSubmit}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="Email"
            name="email"
            type="email"
            title="Enter a valid email address."
            autoComplete="email"
            required
            data-testid="email-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="error-message" />
        <SubmitButton 
          data-testid="submit-button" 
          className="w-full mt-6" 
          disabled={isPending}
        >
          {isPending ? "Sending..." : "Confirm"}
        </SubmitButton>
      </form>
    </div>
  )
}

export default RequestPasswordReset
