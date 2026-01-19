"use client"

import React, { useState, useEffect, memo } from 'react'

interface MotionDivProps {
  children?: React.ReactNode
  initial?: { opacity?: number }
  animate?: { opacity?: number }
  transition?: { duration?: number; delay?: number }
  style?: React.CSSProperties
  className?: string
  [key: string]: any
}

/**
 * 共享的动画组件 - 不使用 framer-motion 以减少包大小
 */
export const MotionDiv = memo(React.forwardRef<HTMLDivElement, MotionDivProps>(({
  children,
  initial,
  animate,
  transition,
  style,
  ...props
}, ref) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, transition?.delay ? transition.delay * 1000 : 0)

    return () => clearTimeout(timer)
  }, [transition?.delay])

  const opacity = isVisible ? (animate?.opacity ?? 1) : (initial?.opacity ?? 0)

  return (
    <div
      ref={ref}
      {...props}
      style={{
        ...style,
        opacity,
        transition: `opacity ${transition?.duration ?? 0.8}s ease-out`,
      }}
    >
      {children}
    </div>
  )
}))

MotionDiv.displayName = 'MotionDiv'

/**
 * AnimatePresence 包装器
 */
export const AnimatePresence = ({ children }: { children: React.ReactNode }) => <>{children}</>
