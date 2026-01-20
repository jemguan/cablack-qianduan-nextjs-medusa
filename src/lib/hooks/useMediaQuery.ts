import { useState, useEffect } from "react"

/**
 * 通用的媒体查询 Hook
 * @param query - CSS 媒体查询字符串，如 "(min-width: 768px)"
 * @returns 是否匹配该媒体查询
 *
 * @example
 * // 检查是否为桌面端
 * const isDesktop = useMediaQuery("(min-width: 768px)")
 *
 * @example
 * // 检查是否为暗色模式
 * const prefersDark = useMediaQuery("(prefers-color-scheme: dark)")
 *
 * @example
 * // 检查是否启用减少动画
 * const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // 服务端渲染时返回 false
    if (typeof window === "undefined") {
      return
    }

    const mediaQuery = window.matchMedia(query)

    // 设置初始值
    setMatches(mediaQuery.matches)

    // 监听变化
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // 使用现代 API（addEventListener）而不是已弃用的 addListener
    mediaQuery.addEventListener("change", handler)

    return () => {
      mediaQuery.removeEventListener("change", handler)
    }
  }, [query])

  return matches
}

// 预定义的断点常量
export const BREAKPOINTS = {
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
  "2xl": "(min-width: 1536px)",
} as const

/**
 * 检查是否为平板及以上尺寸 (>=768px)
 */
export function useIsTablet(): boolean {
  return useMediaQuery(BREAKPOINTS.md)
}

/**
 * 检查是否为桌面端 (>=1024px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery(BREAKPOINTS.lg)
}

/**
 * 检查用户是否偏好减少动画
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)")
}

/**
 * 检查用户是否偏好暗色模式
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery("(prefers-color-scheme: dark)")
}

export default useMediaQuery
