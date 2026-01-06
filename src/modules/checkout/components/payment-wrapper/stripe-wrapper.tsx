"use client"

import { Stripe, StripeElementsOptions, Appearance } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { HttpTypes } from "@medusajs/types"
import { createContext, useEffect, useState } from "react"

type StripeWrapperProps = {
  paymentSession: HttpTypes.StorePaymentSession
  stripeKey?: string
  stripePromise: Promise<Stripe | null> | null
  children: React.ReactNode
}

export const StripeContext = createContext(false)

const StripeWrapper: React.FC<StripeWrapperProps> = ({
  paymentSession,
  stripeKey,
  stripePromise,
  children,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"))
    }
    
    checkDarkMode()
    
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    
    return () => observer.disconnect()
  }, [])

  // Payment Element appearance configuration
  const appearance: Appearance = {
    theme: isDarkMode ? "night" : "stripe",
    variables: {
      colorPrimary: "#0570de",
      colorBackground: isDarkMode ? "hsl(0, 0%, 0%)" : "#ffffff",
      colorText: isDarkMode ? "hsl(210, 40%, 98%)" : "#30313d",
      colorDanger: "#df1b41",
      fontFamily: "Inter, system-ui, sans-serif",
      spacingUnit: "4px",
      borderRadius: "8px",
    },
    rules: {
      ".Input": {
        border: isDarkMode ? "1px solid hsl(0, 0%, 15%)" : "1px solid #e6e6e6",
        boxShadow: "none",
        backgroundColor: isDarkMode ? "hsl(0, 0%, 0%)" : "#ffffff",
        color: isDarkMode ? "hsl(210, 40%, 98%)" : "#30313d",
      },
      ".Input:focus": {
        border: "1px solid #0570de",
        boxShadow: "0 0 0 1px #0570de",
      },
      ".Tab": {
        backgroundColor: isDarkMode ? "hsl(0, 0%, 10%)" : "#f9fafb",
        color: isDarkMode ? "hsl(210, 40%, 98%)" : "#30313d",
      },
      ".Tab--selected": {
        backgroundColor: isDarkMode ? "hsl(0, 0%, 0%)" : "#ffffff",
        color: isDarkMode ? "hsl(210, 40%, 98%)" : "#30313d",
      },
    },
  }

  const clientSecret = paymentSession!.data?.client_secret as string | undefined

  // 验证 client secret 格式
  if (clientSecret) {
    const isTestSecret = clientSecret.includes("_test_") || clientSecret.startsWith("pi_test_")
    const isLiveSecret = clientSecret.includes("_live_") || clientSecret.startsWith("pi_live_")
    const isPublishableKeyTest = stripeKey?.startsWith("pk_test_")
    const isPublishableKeyLive = stripeKey?.startsWith("pk_live_")

    // 检查环境匹配
    if (isTestSecret && isPublishableKeyLive) {
      console.error(
        "[Stripe] 环境不匹配：Payment Intent 是测试环境，但 Publishable Key 是生产环境。",
        "请确保前端和后端使用相同的 Stripe 环境（都是 test 或都是 live）"
      )
    }
    if (isLiveSecret && isPublishableKeyTest) {
      console.error(
        "[Stripe] 环境不匹配：Payment Intent 是生产环境，但 Publishable Key 是测试环境。",
        "请确保前端和后端使用相同的 Stripe 环境（都是 test 或都是 live）"
      )
    }

    // 检查密钥账户匹配（通过密钥前缀）
    if (stripeKey && clientSecret) {
      const stripeKeyAccountId = stripeKey.split("_")[2] // pk_live_51S... -> 51S...
      const clientSecretAccountId = clientSecret.split("_")[2] // pi_live_51S... -> 51S...
      
      if (stripeKeyAccountId && clientSecretAccountId && stripeKeyAccountId !== clientSecretAccountId) {
        console.error(
          "[Stripe] 密钥账户不匹配：",
          `Publishable Key 账户: ${stripeKeyAccountId.substring(0, 10)}...`,
          `Payment Intent 账户: ${clientSecretAccountId.substring(0, 10)}...`,
          "请确保前端 Publishable Key 和后端 Secret Key 来自同一个 Stripe 账户"
        )
      }
    }
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance,
  }

  if (!stripeKey) {
    throw new Error(
      "Stripe key is missing. Set NEXT_PUBLIC_STRIPE_KEY environment variable."
    )
  }

  if (!stripePromise) {
    throw new Error(
      "Stripe promise is missing. Make sure you have provided a valid Stripe key."
    )
  }

  if (!clientSecret) {
    throw new Error(
      "Stripe client secret is missing. Cannot initialize Stripe."
    )
  }

  return (
    <StripeContext.Provider value={true}>
      <Elements 
        key={isDarkMode ? "dark" : "light"} 
        options={options} 
        stripe={stripePromise}
      >
        {children}
      </Elements>
    </StripeContext.Provider>
  )
}

export default StripeWrapper
