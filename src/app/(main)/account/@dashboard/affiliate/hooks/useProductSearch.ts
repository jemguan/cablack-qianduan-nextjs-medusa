"use client"

import { useState, useEffect } from "react"
import type { Product } from "../types"

/**
 * 产品搜索 Hook
 */
export function useProductSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.length < 2) {
        setProducts([])
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(
          `/api/medusa-proxy/products?q=${encodeURIComponent(searchQuery)}&limit=10`
        )
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        }
      } catch (error) {
        console.error("Error searching products:", error)
      } finally {
        setIsSearching(false)
      }
    }

    const debounce = setTimeout(searchProducts, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery])

  const clearSearch = () => {
    setSearchQuery("")
    setProducts([])
  }

  return {
    searchQuery,
    setSearchQuery,
    products,
    isSearching,
    clearSearch,
  }
}
