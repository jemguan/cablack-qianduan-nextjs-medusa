"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { 
  getAffiliateParamsFromUrl, 
  getAffiliateParamsFromStorage, 
  setAffiliateParams,
  buildAffiliateQueryString,
  AffiliateParams 
} from "@lib/affiliate-tracking"

/**
 * 全局 Affiliate 追踪组件
 * 在每个页面加载时检测 URL 参数并保存
 * 同时确保 affiliate 参数在导航时保持
 */
export default function AffiliateTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // 检查并保存完整的 affiliate 参数
  useEffect(() => {
    const urlParams = getAffiliateParamsFromUrl()
    
    if (urlParams) {
      // URL 中有 affiliate 参数，保存完整参数
      setAffiliateParams(urlParams)
    }
  }, [searchParams])

  // 当路径变化时，检查是否需要添加 affiliate 参数
  useEffect(() => {
    const currentRef = searchParams.get("ref")
    const storedParams = getAffiliateParamsFromStorage()
    
    // 如果 localStorage 有 affiliate 参数但 URL 中没有，添加到 URL
    if (storedParams && !currentRef) {
      const newSearchParams = new URLSearchParams(searchParams.toString())
      
      // 添加保存的完整参数
      newSearchParams.set("ref", storedParams.ref)
      if (storedParams.tid) {
        newSearchParams.set("tid", storedParams.tid)
      }
      if (storedParams.utm_source) {
        newSearchParams.set("utm_source", storedParams.utm_source)
      }
      
      // 使用 replaceState 更新 URL，不触发导航
      const newUrl = `${pathname}?${newSearchParams.toString()}`
      window.history.replaceState(null, "", newUrl)
    }
  }, [pathname, searchParams])

  // 拦截所有链接点击，添加 affiliate 参数
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest("a")
      
      if (!link) return
      
      const href = link.getAttribute("href")
      if (!href) return
      
      // 只处理内部链接
      if (href.startsWith("http") && !href.includes(window.location.host)) {
        return
      }
      
      // 跳过特殊链接
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return
      }
      
      const storedParams = getAffiliateParamsFromStorage()
      if (!storedParams) return
      
      // 检查链接是否已经有 ref 参数
      try {
        const url = new URL(href, window.location.origin)
        if (!url.searchParams.get("ref")) {
          // 添加完整的 affiliate 参数
          url.searchParams.set("ref", storedParams.ref)
          if (storedParams.tid) {
            url.searchParams.set("tid", storedParams.tid)
          }
          if (storedParams.utm_source) {
            url.searchParams.set("utm_source", storedParams.utm_source)
          }
          
          // 更新链接
          link.setAttribute("href", url.pathname + url.search + url.hash)
        }
      } catch (error) {
        // 忽略无效 URL
      }
    }
    
    // 使用 mousedown 而不是 click，这样可以在导航前修改链接
    document.addEventListener("mousedown", handleClick)
    
    return () => {
      document.removeEventListener("mousedown", handleClick)
    }
  }, [])

  // 不渲染任何内容
  return null
}
