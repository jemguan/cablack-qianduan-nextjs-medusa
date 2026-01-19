import { ArrowUpRightMini } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import LocalizedClientLink from "../localized-client-link"

type InteractiveLinkProps = {
  href?: string | null
  children?: React.ReactNode
  onClick?: () => void
  className?: string
}

const InteractiveLink = ({
  href,
  children,
  onClick,
  className,
  ...props
}: InteractiveLinkProps) => {
  // Check if href is valid (non-empty string)
  const isClickable = href && href.trim() !== ""

  return (
    <LocalizedClientLink
      className={`flex gap-x-1 items-center group ${className || ''}`}
      href={href}
      onClick={onClick}
      {...props}
    >
      <Text className={isClickable ? "text-ui-fg-interactive" : "text-ui-fg-subtle"}>
        {children}
      </Text>
      {isClickable && (
        <ArrowUpRightMini
          className="group-hover:rotate-45 ease-in-out duration-150"
          color="var(--fg-interactive)"
        />
      )}
    </LocalizedClientLink>
  )
}

export default InteractiveLink
