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

  // 验证 client secret 格式和环境匹配
  if (clientSecret && stripeKey) {
    const isPublishableKeyTest = stripeKey.startsWith("pk_test_")
    const isPublishableKeyLive = stripeKey.startsWith("pk_live_")

    // Payment Intent ID 格式检查（clientSecret 格式：pi_<id>_secret_<secret>）
    // 注意：Payment Intent ID 不包含账户 ID，所以无法从前端验证账户匹配
    // 账户匹配验证应该在后端进行
    
    // 仅在开发环境显示环境匹配警告
    if (process.env.NODE_ENV === "development") {
      // Payment Intent ID 格式：pi_<timestamp>_<random>
      // 无法从 Payment Intent ID 判断环境，但可以通过后端返回的数据判断
      // 这里只检查 Publishable Key 的环境
      if (isPublishableKeyTest) {
        // 测试环境 - 正常
      } else if (isPublishableKeyLive) {
        // 生产环境 - 正常
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
