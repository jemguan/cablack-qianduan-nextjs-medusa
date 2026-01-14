"use client"

import { useActionState, useState, useEffect } from "react"
import Input from "@modules/common/components/input"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction, isPending] = useActionState(signup, null)
  const [showVerificationMessage, setShowVerificationMessage] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  useEffect(() => {
    // 检查注册是否成功：
    // - message 不是字符串（错误）且不是 null，说明返回了 customer 对象（成功）
    // - 需要确保已经提交过且不在 pending 状态
    if (hasSubmitted && !isPending) {
      if (message !== null && typeof message !== "string") {
        // 返回了 customer 对象，注册成功
        setShowVerificationMessage(true)
        // 清空表单（可选）
        // formRef.current?.reset()
      } else if (message && typeof message === "string") {
        // 返回了错误字符串，注册失败
        setShowVerificationMessage(false)
      }
    }
  }, [hasSubmitted, isPending, message])

  const handleSubmit = async (formData: FormData) => {
    setHasSubmitted(true)
    return formAction(formData)
  }

  return (
    <div
      className="max-w-sm flex flex-col items-center"
      data-testid="register-page"
    >
      <h1 className="text-large-semi uppercase mb-6">
        Become an Onahole Station Member
      </h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-4">
        Create your Onahole Station Member profile, and get access to an enhanced
        shopping experience.
      </p>
      {showVerificationMessage && (
        <div className="w-full mb-6 p-4 bg-ui-bg-success-subtle border border-ui-border-success rounded-md">
          <p className="text-base-regular text-ui-fg-success mb-2 font-semibold">
            ✓ Registration successful!
          </p>
          <p className="text-small-regular text-ui-fg-base mb-2">
            We've sent a verification email to your inbox. Please check your email and click the verification link to complete your account setup.
          </p>
          <p className="text-small-regular text-ui-fg-muted mb-4">
            You can now log in, but please verify your email to get full access to all features.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
              className="text-small-regular text-ui-fg-interactive hover:text-ui-fg-interactive-hover underline"
            >
              Go to Login →
            </button>
          </div>
        </div>
      )}
      <form className="w-full flex flex-col" action={handleSubmit}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="First name"
            name="first_name"
            required
            autoComplete="given-name"
            data-testid="first-name-input"
          />
          <Input
            label="Last name"
            name="last_name"
            required
            autoComplete="family-name"
            data-testid="last-name-input"
          />
          <Input
            label="Email"
            name="email"
            required
            type="email"
            autoComplete="email"
            data-testid="email-input"
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            data-testid="phone-input"
          />
          <Input
            label="Password"
            name="password"
            required
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
          />
        </div>
        <ErrorMessage error={typeof message === "string" ? message : null} data-testid="register-error" />
        <span className="text-center text-ui-fg-base text-small-regular mt-6">
          By creating an account, you agree to Onahole Station&apos;s{" "}
          <LocalizedClientLink
            href="/content/privacy-policy"
            className="underline"
          >
            Privacy Policy
          </LocalizedClientLink>{" "}
          and{" "}
          <LocalizedClientLink
            href="/content/terms-of-use"
            className="underline"
          >
            Terms of Use
          </LocalizedClientLink>
          .
        </span>
        <SubmitButton className="w-full mt-6" data-testid="register-button">
          Join
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        Already a member?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="underline"
        >
          Sign in
        </button>
        .
      </span>
    </div>
  )
}

export default Register
