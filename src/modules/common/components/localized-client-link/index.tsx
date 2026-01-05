"use client"

import Link from "next/link"
import React from "react"

/**
 * Use this component to create a Next.js `<Link />`.
 * Previously added country code prefix, now just passes through the href.
 * Kept for backward compatibility with existing code.
 * 
 * When href is empty/null/undefined, renders a non-clickable span instead of a Link
 * to prevent Next.js formatUrl errors.
 */
const LocalizedClientLink = ({
  children,
  href,
  className,
  onClick,
  ...props
}: {
  children?: React.ReactNode
  href?: string | null
  className?: string
  onClick?: () => void
  passHref?: true
  [x: string]: any
}) => {
  // If href is empty, null, or undefined, render a non-clickable element
  if (!href || href.trim() === "") {
    return (
      <span className={className} {...props}>
        {children}
      </span>
    )
  }

  return (
    <Link href={href} className={className} onClick={onClick} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink
