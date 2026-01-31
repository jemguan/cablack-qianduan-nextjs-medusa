"use client"

import React, { useState, useCallback, useRef } from "react"
import { usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@medusajs/ui"
import { usePreviewConfig } from "@lib/context/preview-config-context"
import MegaMenuPanel, { MegaMenuItem } from "@modules/layout/components/mega-menu-panel"

interface HeaderInlineMenuProps {
  menuItems: MegaMenuItem[]
}

const HeaderInlineMenu = ({ menuItems: serverMenuItems }: HeaderInlineMenuProps) => {
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
    <>
      {/* CSS for hover effects using CSS variables */}
      <style dangerouslySetInnerHTML={{ __html: `
        .inline-menu-item:hover .inline-menu-bg,
        .inline-menu-item.is-active .inline-menu-bg {
          opacity: 1;
        }
        /* Triangle: show down by default, switch to up on hover/active */
        .inline-menu-item:hover .tri-down,
        .inline-menu-item.is-active .tri-down {
          display: none;
        }
        .inline-menu-item .tri-up {
          display: none;
        }
        .inline-menu-item:hover .tri-up,
        .inline-menu-item.is-active .tri-up {
          display: block;
        }
      `}} />
      <div className="hidden small:flex items-stretch h-full">
        {menuItems.map((item, index) => {
          const itemUrl = item.url?.trim() || ""
          const hasUrl = itemUrl !== ""
          const hasChildren = item.children && item.children.length > 0
          const isOpen = activeTopIndex === index

          return (
            <div
              key={item.id}
              className={clx("inline-menu-item relative flex items-stretch", isOpen && "is-active")}
              onMouseEnter={() => handleTopItemEnter(index)}
              onMouseLeave={handleMenuAreaLeave}
            >
              <LocalizedClientLink
                href={item.url}
                className={clx(
                  "relative flex items-center justify-center px-3 text-base transition-all duration-200",
                  hasUrl && "hover:text-[var(--header-link-hover-color)]",
                  hasUrl
                    ? "text-[var(--header-text-color)]"
                    : "text-[var(--header-text-color)] cursor-default"
                )}
                {...(item.openInNewTab && hasUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {/* Background overlay - fixed-size notch with rounded corners via CSS mask */}
                <div
                  className="inline-menu-bg absolute inset-0 bottom-[6px] opacity-0 transition-opacity duration-200 pointer-events-none rounded-b-[6px]"
                  style={{
                    background: 'var(--header-inline-active-bg, rgba(59,130,246,0.3))',
                    ...(hasChildren ? {
                      maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='8' viewBox='0 0 14 8'%3E%3Cpolygon points='0,8 7,0 14,8' fill='black'/%3E%3C/svg%3E"), linear-gradient(#000,#000)`,
                      maskSize: '14px 8px, 100% 100%',
                      maskPosition: 'center bottom, center center',
                      maskRepeat: 'no-repeat, no-repeat',
                      maskComposite: 'exclude',
                      WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='8' viewBox='0 0 14 8'%3E%3Cpolygon points='0,8 7,0 14,8' fill='black'/%3E%3C/svg%3E"), linear-gradient(#000,#000)`,
                      WebkitMaskSize: '10px 6px, 100% 100%',
                      WebkitMaskPosition: 'center bottom, center center',
                      WebkitMaskRepeat: 'no-repeat, no-repeat',
                      WebkitMaskComposite: 'xor',
                    } as React.CSSProperties : {}),
                  }}
                />

                <span className="relative z-10">{item.label}</span>

                {/* Triangle indicators for items with children */}
                {hasChildren && (
                  <>
                    {/* Down chevron - default state */}
                    <svg
                      className="tri-down absolute bottom-[2px] left-1/2 -translate-x-1/2 z-10"
                      width="14" height="8" viewBox="0 0 14 8" fill="none"
                    >
                      <path d="M1 1l6 6 6-6" stroke="var(--header-inline-triangle-color, currentColor)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {/* Up chevron - shown on hover/active, below the notch */}
                    <svg
                      className="tri-up absolute -bottom-[2px] left-1/2 -translate-x-1/2 z-10"
                      width="14" height="8" viewBox="0 0 14 8" fill="none"
                    >
                      <path d="M1 7l6-6 6 6" stroke="var(--header-inline-triangle-color, currentColor)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
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
    </>
  )
}

export default HeaderInlineMenu
