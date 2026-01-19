"use client"

import type { PaginationProps } from "../types"

/**
 * 分页组件
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      <span className="text-sm text-muted-foreground">
        {currentPage} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  )
}
