"use client"

import Link from "next/link"
import React from "react"

/**
 * Use this component to create a Next.js `<Link />`.
 * Previously added country code prefix, now just passes through the href.
 * Kept for backward compatibility with existing code.
 */
const LocalizedClientLink = ({
  children,
  href,
  ...props
}: {
  children?: React.ReactNode
  href: string
  className?: string
  onClick?: () => void
  passHref?: true
  [x: string]: any
}) => {
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink
