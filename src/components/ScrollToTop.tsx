"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/**
 * 确保页面刷新和路由变化时滚动到顶部
 * 简化版本 - 移除多余的滚动调用以提升性能
 */
export function ScrollToTop() {
  const pathname = usePathname()

  // 路由变化时滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

