"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/**
 * 确保页面刷新时滚动到顶部
 * 特别是在移动端，防止页面从中间位置开始
 */
export function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    // 路由变化时滚动到顶部
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0)
    }
  }, [pathname])

  // 页面加载时确保滚动到顶部（特别是刷新时）
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    
    // 立即滚动到顶部
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto' as ScrollBehavior
      })
      // 同时设置 documentElement 和 body 的 scrollTop
      if (document.documentElement) {
        document.documentElement.scrollTop = 0
      }
      if (document.body) {
        document.body.scrollTop = 0
      }
    }
    
    // 立即执行
    scrollToTop()
    
    // 使用 requestAnimationFrame 确保在 DOM 更新后执行
    requestAnimationFrame(() => {
      scrollToTop()
    })
    
    // 使用 setTimeout 作为备用
    setTimeout(() => {
      scrollToTop()
    }, 0)
    
    // 监听页面加载事件
    const handleLoad = () => {
      scrollToTop()
    }
    
    window.addEventListener('load', handleLoad)
    
    // 如果页面已经加载完成，立即执行
    if (document.readyState === 'complete') {
      handleLoad()
    }
    
    // 监听 DOMContentLoaded 事件
    const handleDOMContentLoaded = () => {
      scrollToTop()
    }
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handleDOMContentLoaded)
    } else {
      handleDOMContentLoaded()
    }
    
    return () => {
      window.removeEventListener('load', handleLoad)
      document.removeEventListener('DOMContentLoaded', handleDOMContentLoaded)
    }
  }, [])

  return null
}

