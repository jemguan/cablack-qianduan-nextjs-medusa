"use client"

import React from "react"
import { usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@medusajs/ui"
import { usePreviewConfig } from "@lib/context/preview-config-context"

interface MenuItem {
  id: string
  label: string
  url?: string | null
  openInNewTab?: boolean
  children?: MenuItem[]
}

interface HeaderInlineMenuProps {
  menuItems: MenuItem[]
}

const HeaderInlineMenu = ({ menuItems: serverMenuItems }: HeaderInlineMenuProps) => {
  const pathname = usePathname()
  const { previewConfig, isPreviewMode } = usePreviewConfig()

  const menuItems: MenuItem[] = isPreviewMode && previewConfig?.headerConfig?.menu?.menuItems
    ? (previewConfig.headerConfig.menu.menuItems as MenuItem[])
    : serverMenuItems

  return (
    <>
      {/* CSS for hover effects using CSS variables */}
      <style dangerouslySetInnerHTML={{ __html: `
        .inline-menu-item:hover .inline-menu-bg {
          opacity: 1;
        }
        /* Triangle: show down by default, switch to up on hover */
        .inline-menu-item:hover .tri-down {
          display: none;
        }
        .inline-menu-item .tri-up {
          display: none;
        }
        .inline-menu-item:hover .tri-up {
          display: block;
        }
      `}} />
      <div className="hidden small:flex items-stretch h-full">
        {menuItems.map((item) => {
          const itemUrl = item.url?.trim() || ""
          const hasUrl = itemUrl !== ""
          const hasChildren = item.children && item.children.length > 0

          return (
            <div
              key={item.id}
              className="inline-menu-item relative group flex items-stretch"
            >
              <LocalizedClientLink
                href={item.url}
                className={clx(
                  "relative flex items-center justify-center px-5 text-small-regular transition-all duration-200",
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

              {/* Dropdown submenu */}
              {hasChildren && (
                <div className="absolute top-full left-0 hidden group-hover:block pt-3 min-w-[200px] z-50">
                  <div className="bg-card border border-border rounded-lg shadow-md">
                    <ul className="flex flex-col py-2">
                      {item.children!.map((child) => {
                        const childUrl = child.url?.trim() || ""
                        const hasChildUrl = childUrl !== ""
                        const isChildActive = hasChildUrl && (pathname === child.url || pathname.startsWith(`${child.url}/`))
                        const hasGrandchildren = child.children && child.children.length > 0

                        return (
                          <li key={child.id} className={clx("relative", hasGrandchildren && "[&:hover>.submenu-level3]:block")}>
                            <LocalizedClientLink
                              href={child.url}
                              className={clx(
                                "flex items-center justify-between px-4 py-2 text-small-regular transition-all",
                                isChildActive
                                  ? "text-primary font-semibold bg-muted/30"
                                  : hasChildUrl
                                    ? "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                                    : "text-muted-foreground hover:bg-muted/30 cursor-default"
                              )}
                              {...(child.openInNewTab && hasChildUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                            >
                              <span>{child.label}</span>
                              {hasGrandchildren && (
                                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              )}
                            </LocalizedClientLink>

                            {/* Third level menu */}
                            {hasGrandchildren && (
                              <div className="submenu-level3 absolute left-full top-0 hidden pl-2 min-w-[180px] z-[60]">
                                <div className="bg-card border border-border rounded-lg shadow-md">
                                  <ul className="flex flex-col py-2">
                                    {child.children!.map((grandchild) => {
                                      const grandchildUrl = grandchild.url?.trim() || ""
                                      const hasGrandchildUrl = grandchildUrl !== ""
                                      const isGrandchildActive = hasGrandchildUrl && (pathname === grandchild.url || pathname.startsWith(`${grandchild.url}/`))

                                      return (
                                        <li key={grandchild.id}>
                                          <LocalizedClientLink
                                            href={grandchild.url}
                                            className={clx(
                                              "block px-4 py-2 text-small-regular transition-all whitespace-nowrap",
                                              isGrandchildActive
                                                ? "text-primary font-semibold bg-muted/30"
                                                : hasGrandchildUrl
                                                  ? "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                                                  : "text-muted-foreground cursor-default"
                                            )}
                                            {...(grandchild.openInNewTab && hasGrandchildUrl ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                                          >
                                            {grandchild.label}
                                          </LocalizedClientLink>
                                        </li>
                                      )
                                    })}
                                  </ul>
                                </div>
                              </div>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

export default HeaderInlineMenu
