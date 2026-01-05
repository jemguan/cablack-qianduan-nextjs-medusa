"use client"

import { clx } from "@medusajs/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useCallback, startTransition } from "react"
import ChevronLeft from "@modules/common/icons/chevron-left"
import ChevronRight from "@modules/common/icons/chevron-right"

interface DotPaginationProps {
  page: number
  totalPages: number
  'data-testid'?: string
  // 可选：用于搜索页面保留搜索关键词
  searchTerm?: string
  // 可选：自定义类名
  className?: string
}

/**
 * 现代点状分页组件
 * 使用圆点指示器显示分页，当前页的点会更大更亮
 */
export function Pagination({
  page,
  totalPages,
  'data-testid': dataTestid,
  searchTerm,
  className,
}: DotPaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // 构建 URL 的辅助函数
  const buildUrl = useCallback((pageNum: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", pageNum.toString())
    
    // 如果提供了搜索关键词，保留它
    if (searchTerm) {
      params.set("q", searchTerm)
    }
    
    return `${pathname}?${params.toString()}`
  }, [pathname, searchParams, searchTerm])

  // 处理页面切换 - 使用 startTransition 优化性能
  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      router.push(buildUrl(newPage))
    })
  }

  // 预加载后2页的数据
  useEffect(() => {
    // 预加载下一页
    if (page < totalPages) {
      const nextPageUrl = buildUrl(page + 1)
      router.prefetch(nextPageUrl)
    }
    
    // 预加载再下一页
    if (page < totalPages - 1) {
      const nextNextPageUrl = buildUrl(page + 2)
      router.prefetch(nextNextPageUrl)
    }
  }, [page, totalPages, router, buildUrl])

  // 如果只有一页或没有页面，不显示分页
  if (totalPages <= 1) {
    return null
  }

  // 如果页面太多（超过20页），只显示当前页前后各5页的点
  const MAX_DOTS = 20
  const getVisiblePages = () => {
    if (totalPages <= MAX_DOTS) {
      // 显示所有页面
      return Array.from({ length: totalPages }, (_, index) => index + 1)
    }

    // 计算显示的页面范围
    const halfRange = Math.floor(MAX_DOTS / 2)
    let start = Math.max(1, page - halfRange)
    let end = Math.min(totalPages, page + halfRange)

    // 如果当前页靠近开头，显示前 MAX_DOTS 页
    if (page <= halfRange) {
      start = 1
      end = MAX_DOTS
    }

    // 如果当前页靠近结尾，显示后 MAX_DOTS 页
    if (page >= totalPages - halfRange) {
      start = totalPages - MAX_DOTS + 1
      end = totalPages
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index)
  }

  const visiblePages = getVisiblePages()
  const isFirstPage = page === 1
  const isLastPage = page === totalPages

  return (
    <div 
      className={clx("flex flex-col justify-center items-center w-full mt-12", className)}
      data-testid={dataTestid}
    >
      <div className="flex items-center gap-8 flex-wrap justify-center max-w-full px-4">
        {/* 上一页按钮 */}
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={isFirstPage}
          className={clx(
            "flex items-center justify-center w-8 h-8 rounded-full",
            "transition-all duration-200 ease-in-out",
            "focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive focus:ring-offset-2",
            {
              "bg-ui-bg-subtle-hover text-ui-fg-base hover:bg-ui-bg-base cursor-pointer": !isFirstPage,
              "bg-ui-bg-subtle text-ui-fg-muted cursor-not-allowed opacity-50": isFirstPage,
            }
          )}
          aria-label="Go to previous page"
          aria-disabled={isFirstPage}
        >
          <ChevronLeft size="16" />
        </button>

        {/* 点状分页指示器 */}
        <div className="flex items-center gap-3">
          {visiblePages.map((pageNumber) => {
            const isActive = pageNumber === page

            return (
              <button
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber)}
                className={clx(
                  "transition-all duration-300 ease-in-out rounded-full",
                  "focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive focus:ring-offset-2",
                  "flex-shrink-0",
                  {
                    // 当前页：更大的圆点，更亮的颜色
                    "w-3 h-3 bg-ui-fg-interactive": isActive,
                    // 非当前页：较小的圆点，较暗的颜色，hover 时变大
                    "w-2 h-2 bg-ui-border-base hover:bg-ui-fg-muted hover:w-2.5 hover:h-2.5": !isActive,
                  }
                )}
                aria-label={`Go to page ${pageNumber}`}
                aria-current={isActive ? "page" : undefined}
              />
            )
          })}
        </div>

        {/* 下一页按钮 */}
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={isLastPage}
          className={clx(
            "flex items-center justify-center w-8 h-8 rounded-full",
            "transition-all duration-200 ease-in-out",
            "focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive focus:ring-offset-2",
            {
              "bg-ui-bg-subtle-hover text-ui-fg-base hover:bg-ui-bg-base cursor-pointer": !isLastPage,
              "bg-ui-bg-subtle text-ui-fg-muted cursor-not-allowed opacity-50": isLastPage,
            }
          )}
          aria-label="Go to next page"
          aria-disabled={isLastPage}
        >
          <ChevronRight size="16" />
        </button>
      </div>
      {/* 页数显示 */}
      <div className="mt-4 text-small-regular text-ui-fg-subtle">
        Page {page} of {totalPages}
      </div>
    </div>
  )
}
