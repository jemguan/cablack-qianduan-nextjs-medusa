"use client"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPrevPage: () => void
  onNextPage: () => void
  hasPrevPage: boolean
  hasNextPage: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  hasPrevPage,
  hasNextPage,
}: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
      <button
        onClick={onPrevPage}
        disabled={!hasPrevPage}
        className="px-4 py-2 text-sm border border-border/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/50 transition-all duration-200 cursor-pointer text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px]"
        aria-label="Go to previous page"
      >
        Previous
      </button>
      <span className="text-sm text-muted-foreground">
        Page {currentPage} / {totalPages}
      </span>
      <button
        onClick={onNextPage}
        disabled={!hasNextPage}
        className="px-4 py-2 text-sm border border-border/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/50 transition-all duration-200 cursor-pointer text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px]"
        aria-label="Go to next page"
      >
        Next
      </button>
    </div>
  )
}
