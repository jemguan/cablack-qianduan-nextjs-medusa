import Link from "next/link"
import { clx } from "@medusajs/ui"

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  countryCode?: string // No longer used, kept for backward compatibility
  className?: string
}

export default function Breadcrumb({
  items,
  className = "",
}: BreadcrumbProps) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <nav
      className={`text-sm text-ui-fg-subtle ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-2 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          // 检查文本是否可能被截断（超过一定长度）
          const isLongText = item.label.length > 20

          return (
            <li key={index} className="flex items-center min-w-0">
              {index > 0 && <span className="mx-2 flex-shrink-0">/</span>}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={clx(
                    "hover:text-ui-fg-base transition-colors",
                    "max-w-[120px] small:max-w-[200px] truncate",
                    "block"
                  )}
                  title={isLongText ? item.label : undefined}
                >
                  {item.label}
                </Link>
              ) : (
                <span 
                  className={clx(
                    isLast ? "text-ui-fg-base" : "",
                    "max-w-[120px] small:max-w-[200px] truncate",
                    "block"
                  )}
                  title={isLongText ? item.label : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
