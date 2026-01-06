"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import GoogleLoginButton from "@modules/account/components/google-login-button"
import User from "@modules/common/icons/user"
import { useRouter, useParams } from "next/navigation"
import { Fragment, useState } from "react"
import { useActionState } from "react"

const AccountDropdown = () => {
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false)
  const [currentView, setCurrentView] = useState<LOGIN_VIEW>(LOGIN_VIEW.SIGN_IN)
  const router = useRouter()
  const params = useParams()
  const countryCode = params?.countryCode as string

  const open = () => setAccountDropdownOpen(true)
  const close = () => setAccountDropdownOpen(false)

  const handleLogin = async (_currentState: unknown, formData: FormData) => {
    const result = await login(_currentState, formData)
    if (!result) {
      // Login successful, close dropdown and refresh
      close()
      // Refresh the page to update the account button state
      router.refresh()
    }
    return result
  }

  const [message, formAction] = useActionState(handleLogin, null)

  return (
    <div
      className="h-full z-50"
      onMouseEnter={open}
      onMouseLeave={close}
    >
      <Popover className="relative h-full">
        <PopoverButton 
          className="h-full focus:outline-none p-2 text-ui-fg-subtle hover:text-ui-fg-base transition-colors flex items-center justify-center"
          aria-label="Account"
          data-testid="nav-account-link"
        >
          <User size="20" />
        </PopoverButton>
        <Transition
          show={accountDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <PopoverPanel
            static
            className="hidden small:block absolute top-[calc(100%+1px)] right-0 bg-card border border-border w-[380px] text-foreground shadow-xl rounded-b-lg overflow-hidden z-[60]"
            data-testid="nav-account-dropdown"
          >
            <div className="p-6">
              {currentView === LOGIN_VIEW.SIGN_IN ? (
                <div className="w-full flex flex-col items-center">
                  <h2 className="text-large-semi uppercase mb-4">Welcome back</h2>
                  <p className="text-center text-base-regular text-ui-fg-base mb-6">
                    Sign in to access an enhanced shopping experience.
                  </p>
                  
                  {/* Google 登录按钮 */}
                  <div className="w-full mb-4">
                    <GoogleLoginButton />
                  </div>

                  {/* 分隔线 */}
                  <div className="w-full flex items-center gap-4 mb-4">
                    <div className="flex-1 h-px bg-ui-border-base"></div>
                    <span className="text-small-regular text-ui-fg-muted">OR</span>
                    <div className="flex-1 h-px bg-ui-border-base"></div>
                  </div>

                  {/* 邮箱密码登录表单 */}
                  <form className="w-full" action={formAction}>
                    <div className="flex flex-col w-full gap-y-3">
                      <Input
                        label="Email"
                        name="email"
                        type="email"
                        title="Enter a valid email address."
                        autoComplete="email"
                        required
                        data-testid="email-input"
                      />
                      <Input
                        label="Password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        data-testid="password-input"
                      />
                    </div>
                    <ErrorMessage error={message} data-testid="login-error-message" />
                    <SubmitButton data-testid="sign-in-button" className="w-full mt-4">
                      Sign in
                    </SubmitButton>
                  </form>
                  <span className="text-center text-ui-fg-base text-small-regular mt-4">
                    Not a member?{" "}
                    <button
                      onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
                      className="underline hover:text-primary transition-colors"
                      data-testid="register-button"
                    >
                      Join us
                    </button>
                    .
                  </span>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center">
                  <p className="text-center text-base-regular text-ui-fg-base mb-4">
                    Please visit the account page to register.
                  </p>
                  <LocalizedClientLink
                    href="/account"
                    className="text-small-regular underline hover:text-primary transition-colors mb-2"
                    onClick={close}
                  >
                    Go to account page
                  </LocalizedClientLink>
                  <button
                    onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
                    className="text-small-regular underline hover:text-primary transition-colors"
                  >
                    Back to sign in
                  </button>
                </div>
              )}
            </div>
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  )
}

export default AccountDropdown

