"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { useDebounce } from "@lib/hooks/use-debounce"
import { searchProductsClient } from "@lib/data/search-client"
import { HttpTypes } from "@medusajs/types"
import SearchPreview from "../search-preview"

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
)

interface SearchBoxProps {
  className?: string
  variant?: "desktop" | "mobile"
  regionId?: string
}

const SearchBox = ({
  className = "",
  variant = "desktop",
  regionId,
}: SearchBoxProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [searchResults, setSearchResults] = useState<HttpTypes.StoreProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Get current search term from URL
  useEffect(() => {
    try {
      const q = searchParams?.get("q")
      if (q) {
        setSearchTerm(q)
      } else {
        setSearchTerm("")
      }
    } catch (error) {
      // If searchParams is not available (outside Suspense boundary), ignore error
      console.debug("Search params not available:", error)
    }
  }, [searchParams])

  // Real-time search
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchTerm.trim() || !regionId) {
        setSearchResults([])
        setShowPreview(false)
        return
      }

      setIsLoading(true)
      try {
        const result = await searchProductsClient({
          searchTerm: debouncedSearchTerm.trim(),
          regionId,
          limit: 5,
        })
        setSearchResults(result.products)
        setShowPreview(true)
      } catch (error) {
        console.error("Search error:", error)
        setSearchResults([])
      } finally {
        setIsLoading(false)
      }
    }

    performSearch()
  }, [debouncedSearchTerm, regionId])

  // Close preview and input box when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowPreview(false)
        // If input is empty, collapse search box
        if (!searchTerm.trim()) {
          setIsExpanded(false)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [searchTerm])

  const handleProductClick = useCallback(
    (searchTerm: string) => {
      const trimmedTerm = searchTerm.trim()
      if (!trimmedTerm) {
        return
      }

      const searchUrl = `/search?q=${encodeURIComponent(trimmedTerm)}`
      router.push(searchUrl)
      setShowPreview(false)

      // Collapse search box on mobile after search
      if (variant === "mobile" && isExpanded) {
        setIsExpanded(false)
      }
    },
    [router, variant, isExpanded]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setShowPreview(false)
      if (!searchTerm.trim()) {
        setIsExpanded(false)
      }
      inputRef.current?.blur()
    }
    // Removed Enter key navigation functionality
  }

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
    if (!isExpanded) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else {
      setShowPreview(false)
      if (!searchTerm.trim()) {
        setSearchTerm("")
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    if (e.target.value.trim()) {
      // Show preview when typing (if results already exist)
      if (searchResults.length > 0 || isLoading) {
        setShowPreview(true)
      }
    } else {
      setShowPreview(false)
    }
  }

  const handleInputFocus = () => {
    if (searchTerm.trim() && (searchResults.length > 0 || isLoading)) {
      setShowPreview(true)
    }
  }

  // Collapsed state: show search icon button
  if (!isExpanded) {
    return (
      <button
        onClick={handleToggle}
        className="p-2 text-ui-fg-subtle hover:text-ui-fg-base transition-colors"
        aria-label="Search"
      >
        <SearchIcon />
      </button>
    )
  }

  // Expanded state: show full search box
  return (
    <div ref={containerRef} className={`relative flex items-center gap-2 z-[100] ${className}`}>
      <div className="flex-1 relative z-[100]">
        <div className="relative flex-1 max-w-md">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder="Search products..."
            className="w-full px-4 py-2 pl-10 pr-10 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
            aria-label="Search products"
            aria-expanded={showPreview}
            aria-haspopup="listbox"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
            <SearchIcon />
          </div>
          <button
            type="button"
            onClick={() => {
              setIsExpanded(false)
              setShowPreview(false)
              setSearchTerm("")
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
            aria-label="Close search"
          >
            ✕
          </button>
        </div>
        {showPreview && (
          <SearchPreview
            products={searchResults}
            searchTerm={searchTerm}
            isLoading={isLoading}
            onClose={() => setShowPreview(false)}
            onProductClick={handleProductClick}
          />
        )}
      </div>
    </div>
  )
}

export default SearchBox

