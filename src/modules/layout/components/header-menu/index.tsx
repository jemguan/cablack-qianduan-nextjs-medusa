"use client"

import React, { useState, useCallback, useRef } from "react"
import { usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@medusajs/ui"
import { usePreviewConfig } from "@lib/context/preview-config-context"
import MegaMenuPanel, { MegaMenuItem } from "@modules/layout/components/mega-menu-panel"

interface HeaderMenuProps {
  menuItems: MegaMenuItem[]
}

const HeaderMenu = ({ menuItems: serverMenuItems }: HeaderMenuProps) => {
  const pathname = usePathname()
  const { previewConfig, isPreviewMode } = usePreviewConfig()
  const [activeTopIndex, setActiveTopIndex] = useState<number | null>(null)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const menuItems: MegaMenuItem[] = isPreviewMode && previewConfig?.headerConfig?.menu?.menuItems
    ? (previewConfig.headerConfig.menu.menuItems as MegaMenuItem[])
    : serverMenuItems

  const handleTopItemEnter = useCallback((index: number) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    setActiveTopIndex(index)
  }, [])

  const handleMenuAreaLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setActiveTopIndex(null)
    }, 150)
  }, [])

  const handleMenuAreaEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  return (
    <div className="hidden small:flex items-center gap-x-8 py-1">
      {menuItems.map((item, index) => {
        const itemUrl = item.url?.trim() || ""
        const hasUrl = itemUrl !== ""
        const isActive = hasUrl && (
          pathname === itemUrl ||
          pathname.startsWith(`${itemUrl}/`) ||
          pathname.includes(`/${itemUrl.replace(/^\//, '')}`)
        )
        const hasChildren = item.children && item.children.length > 0
        const isOpen = activeTopIndex === index

        return (
          <div
            key={item.id}
            className="relative flex items-center"
            onMouseEnter={() => handleTopItemEnter(index)}
            onMouseLeave={handleMenuAreaLeave}
          >
            <LocalizedClientLink
              href={item.url}
              className={clx(
                "text-small-regular transition-all duration-200 py-1 px-3 border border-border rounded-md",
                hasUrl && "hover:text-[var(--header-link-hover-color)] hover:border-[var(--header-menu-indicator-color)]",
                isActive ? "text-[var(--header-menu-active-color)] font-semibold border-[var(--header-menu-indicator-color)]" : hasUrl ? "text-[var(--header-text-color)]" : "text-[var(--header-text-color)] cursor-default"
              )}
              {...(item.openInNewTab && hasUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {item.label}
            </LocalizedClientLink>

            {/* Mega Menu Dropdown */}
            {hasChildren && isOpen && (
              <MegaMenuPanel
                item={item}
                pathname={pathname}
                onMouseEnter={handleMenuAreaEnter}
                onMouseLeave={handleMenuAreaLeave}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default HeaderMenu
