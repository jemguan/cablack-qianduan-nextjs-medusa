"use client"

import React, { createContext, useContext, useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { isEqual } from "lodash"

type VariantSelectionContextType = {
  options: Record<string, string | undefined>
  selectedVariant: HttpTypes.StoreProductVariant | null
  setOptionValue: (optionId: string, value: string) => void
  setOptions: (options: Record<string, string | undefined>) => void
}

const VariantSelectionContext = createContext<VariantSelectionContextType | undefined>(undefined)

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
): Record<string, string> | null => {
  if (!variantOptions) return null
  return variantOptions.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

type VariantSelectionProviderProps = {
  children: React.ReactNode
  product: HttpTypes.StoreProduct
  initialVariantId?: string
}

export function VariantSelectionProvider({
  children,
  product,
  initialVariantId,
}: VariantSelectionProviderProps) {
  const searchParams = useSearchParams()
  const [options, setOptionsState] = useState<Record<string, string | undefined>>(() => {
    // Initialize options from initialVariantId if provided (SSR/CSR consistency)
    if (initialVariantId && product.variants) {
      const variantFromUrl = product.variants.find((v) => v.id === initialVariantId)
      if (variantFromUrl) {
        return optionsAsKeymap(variantFromUrl.options) ?? {}
      }
    }
    // Fallback to single variant preselection if no initialVariantId
    if (product.variants?.length === 1) {
      return optionsAsKeymap(product.variants[0].options) ?? {}
    }
    return {}
  })

  // Update options from URL v_id after hydration
  useEffect(() => {
    const vIdFromUrl = searchParams.get("v_id")
    if (vIdFromUrl && vIdFromUrl !== initialVariantId && product.variants) {
      const variantFromUrl = product.variants.find((v) => v.id === vIdFromUrl)
      if (variantFromUrl) {
        const variantOptions = optionsAsKeymap(variantFromUrl.options)
        setOptionsState(variantOptions ?? {})
      }
    }
  }, [product.variants, searchParams, initialVariantId])

  // Find selected variant based on current options
  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return null
    }

    return (
      product.variants.find((v) => {
        const variantOptions = optionsAsKeymap(v.options)
        return variantOptions && isEqual(variantOptions, options)
      }) || null
    )
  }, [product.variants, options])

  const setOptionValue = (optionId: string, value: string) => {
    setOptionsState((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  const setOptions = (newOptions: Record<string, string | undefined>) => {
    setOptionsState(newOptions)
  }

  const value: VariantSelectionContextType = {
    options,
    selectedVariant,
    setOptionValue,
    setOptions,
  }

  return (
    <VariantSelectionContext.Provider value={value}>
      {children}
    </VariantSelectionContext.Provider>
  )
}

export function useVariantSelection(): VariantSelectionContextType {
  const context = useContext(VariantSelectionContext)
  if (context === undefined) {
    throw new Error("useVariantSelection must be used within a VariantSelectionProvider")
  }
  return context
}
