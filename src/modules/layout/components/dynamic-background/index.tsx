"use client"

import { useTheme } from "@modules/common/components/theme-toggle"
import { useEffect, useState } from "react"

interface DynamicBackgroundProps {
  children: React.ReactNode
  lightBackgroundColor?: string
  darkBackgroundColor?: string
  className?: string
  as?: "header" | "footer" | "div"
  style?: React.CSSProperties
}

export default function DynamicBackground({
  children,
  lightBackgroundColor,
  darkBackgroundColor,
  className = "",
  as = "div",
  style = {},
}: DynamicBackgroundProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const hasCustomBackground = lightBackgroundColor || darkBackgroundColor
  
  const getBackgroundStyle = () => {
    if (!hasCustomBackground || !mounted) return {}
    
    const color = theme === "dark" 
      ? (darkBackgroundColor || lightBackgroundColor) 
      : (lightBackgroundColor || darkBackgroundColor)
    
    if (!color) return {}
    
    return { backgroundColor: color }
  }

  const Component = as
  const combinedStyle = { ...getBackgroundStyle(), ...style }

  return (
    <Component className={className} style={combinedStyle}>
      {children}
    </Component>
  )
}
