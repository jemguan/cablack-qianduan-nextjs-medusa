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
  onSearchComplete?: () => void // 搜索完成后的回调（用于关闭侧边栏等）
}

const SearchBox = ({
  className = "",
  variant = "desktop",
  regionId,
  defaultExpanded = false,
  onSearchComplete,
}: SearchBoxProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  // 如果 defaultExpanded 为 true，则始终保持展开状态
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const isAlwaysExpanded = defaultExpanded === true
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
  // Skip if search box is always expanded
  useEffect(() => {
    if (isAlwaysExpanded) {
      return
    }
    
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
  }, [searchTerm, isAlwaysExpanded])

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

      // Collapse search box after search
      if (isExpanded && !isAlwaysExpanded) {
        setIsExpanded(false)
      }

      // 调用搜索完成回调（用于关闭侧边栏等）
      if (onSearchComplete) {
        onSearchComplete()
      }

      // Reset navigating state after a short delay
      setTimeout(() => {
        setIsNavigating(false)
      }, 1000)
    },
    [router, variant, isExpanded, isNavigating]
  )

  // Lock body scroll when modal is open (desktop)
  useEffect(() => {
    if (isExpanded && variant === "desktop" && !isAlwaysExpanded) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = ""
      }
    }
  }, [isExpanded, variant, isAlwaysExpanded])

  const handleClose = useCallback(() => {
    setIsExpanded(false)
    setShowPreview(false)
    setSearchTerm("")
    inputRef.current?.blur()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (!isAlwaysExpanded) {
        handleClose()
        return
      }
      setShowPreview(false)
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
          className={`p-2 hover:text-ui-fg-base transition-all duration-200 ${
            variant === "mobile" ? "w-full justify-start px-3 py-2.5 rounded-md border border-border hover:bg-muted text-ui-fg-subtle" : ""
          }`}
          style={variant !== "mobile" ? { color: 'var(--header-icon-color, inherit)' } : undefined}
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

  // Desktop modal search
  if (variant === "desktop" && !isAlwaysExpanded) {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose()
        }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Modal */}
        <div
          ref={containerRef}
          className="relative w-full max-w-lg mx-4 animate-in slide-in-from-top-4 duration-300"
        >
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              placeholder="Search products..."
              className="w-full px-4 py-3 pl-11 pr-10 text-base bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground shadow-2xl"
              aria-label="Search products"
              aria-expanded={showPreview}
              aria-haspopup="listbox"
            />
            <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
              <SearchIcon />
            </div>
            {isLoading ? (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
              </div>
            ) : searchTerm.trim() ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("")
                  setShowPreview(false)
                  setSearchResults([])
                  inputRef.current?.focus()
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                ✕
              </button>
            ) : (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">
                ESC
              </div>
            )}
          </div>
          {showPreview && (
            <div className="mt-2">
              <SearchPreview
                products={searchResults}
                searchTerm={searchTerm}
                count={searchCount}
                isLoading={isLoading}
                onClose={() => setShowPreview(false)}
                onProductClick={handleProductClick}
                variant={variant}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Mobile expanded / always-expanded state
  return (
    <div
      ref={containerRef}
      className={`relative flex items-center gap-2 z-[100] transition-all duration-300 ease-out ${
        variant === "mobile"
          ? "fixed inset-0 bg-background/95 backdrop-blur-sm p-4 flex-col z-[9999] animate-in fade-in slide-in-from-top-2"
          : `${className}`
      }`}
    >
      {/* Mobile: Header with close button */}
      {variant === "mobile" && (
        <div className="flex items-center justify-between w-full mb-4">
          <h2 className="text-lg font-semibold">Search</h2>
          <button
            onClick={handleClose}
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

      <div className="w-full">
        <div className="relative w-full">
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
          ) : searchTerm.trim() && variant === "mobile" ? (
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
          ) : null}
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
    </div>
  )
}

export default SearchBox

