"use client"

import { useState, useMemo } from "react"

/**
 * 通用分页 Hook
 */
export function usePagination<T>(items: T[], itemsPerPage: number = 5) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(items.length / itemsPerPage)

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return items.slice(start, end)
  }, [items, currentPage, itemsPerPage])

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
  }

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }

  const resetPage = () => {
    setCurrentPage(1)
  }

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToNextPage,
    goToPrevPage,
    resetPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  }
}
