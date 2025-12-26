import Link from "next/link"

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  countryCode: string
  className?: string
}

export default function Breadcrumb({
  items,
  countryCode,
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

          return (
            <li key={index} className="flex items-center">
              {index > 0 && <span className="mx-2">/</span>}
              {item.href && !isLast ? (
                <Link
                  href={`/${countryCode}${item.href}`}
                  className="hover:text-ui-fg-base transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-ui-fg-base" : ""}>
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

