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
  defaultExpanded?: boolean
}

const SearchBox = ({
  className = "",
  variant = "desktop",
  regionId,
  defaultExpanded = false,
}: SearchBoxProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || variant === "desktop")
  const [showPreview, setShowPreview] = useState(false)
  const [searchResults, setSearchResults] = useState<HttpTypes.StoreProduct[]>([])
  const [searchCount, setSearchCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
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
      setShowPreview(true) // Show preview immediately when starting search
      try {
        const result = await searchProductsClient({
          searchTerm: debouncedSearchTerm.trim(),
          regionId,
          limit: 5,
        })
        setSearchResults(result.products)
        setSearchCount(result.count)
        // Keep preview visible if there are results or if search term exists
        setShowPreview(true)
      } catch (error) {
        console.error("[SearchBox] Search error:", error)
        setSearchResults([])
        setSearchCount(0)
        // Still show preview to display error state
        setShowPreview(true)
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
      if (!trimmedTerm || isNavigating) {
        return
      }

      setIsNavigating(true)
      setShowPreview(false)

      const searchUrl = `/search?q=${encodeURIComponent(trimmedTerm)}`
      router.push(searchUrl)

      // Collapse search box on mobile after search
      if (variant === "mobile" && isExpanded) {
        setIsExpanded(false)
      }

      // Reset navigating state after a short delay
      setTimeout(() => {
        setIsNavigating(false)
      }, 1000)
    },
    [router, variant, isExpanded, isNavigating]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setShowPreview(false)
      if (!searchTerm.trim()) {
        setIsExpanded(false)
      }
      inputRef.current?.blur()
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (searchTerm.trim() && !isNavigating) {
        handleProductClick(searchTerm)
      }
    }
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
    const value = e.target.value
    setSearchTerm(value)
    if (!value.trim()) {
      setShowPreview(false)
      setSearchResults([])
      setSearchCount(0)
    }
    // Preview will be shown automatically when search completes or is loading
  }

  const handleInputFocus = () => {
    if (searchTerm.trim() && (searchResults.length > 0 || isLoading)) {
      setShowPreview(true)
    }
  }

  // Mobile: Collapsed state - show search icon button
  if (!isExpanded) {
    return (
      <div className="relative">
        <button
          onClick={handleToggle}
          className={`p-2 text-ui-fg-subtle hover:text-ui-fg-base transition-all duration-200 ${
            variant === "mobile" ? "w-full justify-start px-3 py-2.5 rounded-md border border-border hover:bg-muted" : ""
          }`}
          aria-label="Search"
        >
          {variant === "mobile" ? (
            <div className="flex items-center gap-2 w-full">
              <SearchIcon />
              <span className="text-sm text-muted-foreground">Search products...</span>
            </div>
          ) : (
            <SearchIcon />
          )}
        </button>
        {/* Hidden input for Enter key support when collapsed */}
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && searchTerm.trim() && !isNavigating) {
              e.preventDefault()
              handleProductClick(searchTerm)
            } else if (e.key === "Enter") {
              e.preventDefault()
              setIsExpanded(true)
              setTimeout(() => {
                inputRef.current?.focus()
              }, 100)
            }
          }}
          className="absolute opacity-0 pointer-events-none w-0 h-0"
          tabIndex={-1}
        />
      </div>
    )
  }

  // Expanded state: show full search box
  return (
    <div 
      ref={containerRef} 
      className={`relative flex items-center gap-2 z-[100] transition-all duration-300 ease-out ${
        variant === "mobile" 
          ? "fixed inset-0 bg-background/95 backdrop-blur-sm p-4 flex-col z-[9999] animate-in fade-in slide-in-from-top-2" 
          : `${className} animate-in fade-in slide-in-from-left-2`
      }`}
    >
      {/* Mobile: Header with close button */}
      {variant === "mobile" && (
        <div className="flex items-center justify-between w-full mb-4">
          <h2 className="text-lg font-semibold">Search</h2>
          <button
            onClick={() => {
              setIsExpanded(false)
              setShowPreview(false)
              setSearchTerm("")
              inputRef.current?.blur()
            }}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Close search"
          >
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
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}
      
      <div className={`${variant === "desktop" ? "flex-1 relative z-[100]" : "w-full"}`}>
        <div className={`relative ${variant === "desktop" ? "flex-1 max-w-2xl" : "w-full"}`}>
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder="Search products..."
            className={`w-full px-4 py-2.5 pl-10 ${
              variant === "mobile" ? "pr-12 text-base" : "pr-20 text-sm"
            } bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg`}
            aria-label="Search products"
            aria-expanded={showPreview}
            aria-haspopup="listbox"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
            <SearchIcon />
          </div>
          {isLoading ? (
            <div className={`absolute ${variant === "mobile" ? "right-3" : "right-2"} top-1/2 transform -translate-y-1/2`}>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
            </div>
          ) : searchTerm.trim() ? (
            <>
              {variant === "desktop" && (
                <button
                  type="button"
                  onClick={() => {
                    if (searchTerm.trim() && !isNavigating) {
                      handleProductClick(searchTerm)
                    }
                  }}
                  disabled={isNavigating}
                  className={`absolute right-10 top-1/2 transform -translate-y-1/2 text-sm font-medium transition-all duration-200 ${
                    isNavigating
                      ? "text-primary/50 cursor-not-allowed"
                      : "text-primary hover:text-primary/80 active:scale-95"
                  }`}
                  aria-label="Search"
                >
                  {isNavigating ? (
                    <div className="flex items-center gap-1.5">
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent"></div>
                      <span>Searching...</span>
                    </div>
                  ) : (
                    "Search"
                  )}
                </button>
              )}
              {variant === "mobile" && (
                <button
                  type="button"
                  onClick={() => {
                    if (searchTerm.trim() && !isNavigating) {
                      handleProductClick(searchTerm)
                    }
                  }}
                  disabled={isNavigating}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-md transition-all duration-200 ${
                    isNavigating
                      ? "bg-primary/50 cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                  }`}
                  aria-label="Search"
                >
                  {isNavigating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                  ) : (
                    <SearchIcon />
                  )}
                </button>
              )}
              {variant === "desktop" && (
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false)
                    setShowPreview(false)
                    setSearchTerm("")
                  }}
                  disabled={isNavigating}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  aria-label="Close search"
                >
                  ✕
                </button>
              )}
            </>
          ) : (
            variant === "desktop" && (
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false)
                  setShowPreview(false)
                  setSearchTerm("")
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm transition-opacity"
                aria-label="Close search"
              >
                ✕
              </button>
            )
          )}
        </div>
        {showPreview && (
          <SearchPreview
            products={searchResults}
            searchTerm={searchTerm}
            count={searchCount}
            isLoading={isLoading}
            onClose={() => setShowPreview(false)}
            onProductClick={handleProductClick}
            variant={variant}
          />
        )}
      </div>
      
      {/* Mobile: Recent searches or suggestions */}
      {variant === "mobile" && !searchTerm.trim() && !isLoading && (
        <div className="w-full mt-4">
          <p className="text-sm text-muted-foreground mb-2">Popular searches</p>
          <div className="flex flex-wrap gap-2">
            {["New arrivals", "Best sellers", "On sale"].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setSearchTerm(term)
                  inputRef.current?.focus()
                }}
                className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-full transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchBox

