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

  const options: StripeElementsOptions = {
    clientSecret: paymentSession!.data?.client_secret as string | undefined,
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

  if (!paymentSession?.data?.client_secret) {
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
