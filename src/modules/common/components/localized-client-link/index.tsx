"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import React from "react"

/**
 * Use this component to create a Next.js `<Link />` that persists the current country code in the url,
 * without having to explicitly pass it as a prop.
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
  const params = useParams()
  const countryCode = params?.countryCode as string | undefined

  // 如果 countryCode 不存在，使用 href 本身（可能是绝对路径或已经包含 countryCode）
  // 否则添加 countryCode 前缀
  const finalHref = countryCode ? `/${countryCode}${href}` : href

  return (
    <Link href={finalHref} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink
