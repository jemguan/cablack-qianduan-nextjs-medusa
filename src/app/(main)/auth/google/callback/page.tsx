"use client"

import { Suspense } from "react"
import { useRouter } from "next/navigation"
import { useGoogleCallback } from "./hooks"

/**
 * 加载状态组件
 */
function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="max-w-md w-full flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ui-fg-interactive"></div>
        <p className="text-base-regular text-ui-fg-base">
          Authenticating with Google...
        </p>
      </div>
    </div>
  )
}

/**
 * Google 回调内容组件
 * 使用 useSearchParams，需要被 Suspense 包裹
 */
function GoogleCallbackContent() {
  const router = useRouter()
  const { loading, error, customer } = useGoogleCallback()

  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="max-w-md w-full flex flex-col items-center gap-4">
        {loading && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ui-fg-interactive"></div>
            <p className="text-base-regular text-ui-fg-base">
              Authenticating with Google...
            </p>
          </>
        )}

        {error && (
          <>
            <div className="text-ui-fg-error text-large-semi mb-2">
              Authentication Failed
            </div>
            <p className="text-base-regular text-ui-fg-base text-center mb-4">
              {error}
            </p>
            <button
              onClick={() => router.push("/account/login")}
              className="px-4 py-2 bg-ui-button-primary text-ui-button-primary-text rounded-md hover:bg-ui-button-primary-hover"
            >
              Return to Login
            </button>
          </>
        )}

        {customer && !loading && (
          <>
            <div className="text-ui-fg-success text-large-semi mb-2">
              Success!
            </div>
            <p className="text-base-regular text-ui-fg-base text-center">
              Welcome back, {customer.email || "customer"}!
            </p>
            <p className="text-small-regular text-ui-fg-muted">
              Redirecting to your account...
            </p>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Google OAuth 回调页面
 * 使用 Suspense 包裹以支持 useSearchParams
 */
export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <GoogleCallbackContent />
    </Suspense>
  )
}
