"use client"

import React from "react"
import { usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@medusajs/ui"

interface MenuItem {
  id: string
  label: string
  url?: string | null  // URL can be empty/null for non-clickable items
  openInNewTab?: boolean
  children?: MenuItem[]
}

interface HeaderMenuProps {
  menuItems: MenuItem[]
}

const HeaderMenu = ({ menuItems }: HeaderMenuProps) => {
  const pathname = usePathname()

  return (
    <div className="hidden small:flex items-center gap-x-8 py-1">
      {menuItems.map((item) => {
        // 检查当前路径是否匹配菜单项 URL
        // 支持多种 locale 前缀逻辑
        const itemUrl = item.url?.trim() || ""
        const hasUrl = itemUrl !== ""
        const isActive = hasUrl && (
          pathname === itemUrl || 
          pathname.startsWith(`${itemUrl}/`) ||
          pathname.includes(`/${itemUrl.replace(/^\//, '')}`)
        )
        
        return (
          <div key={item.id} className="relative group flex items-center">
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

            {/* Submenu if exists */}
            {item.children && item.children.length > 0 && (
              <div className="absolute top-full left-0 hidden group-hover:block pt-2 min-w-[200px] z-50">
                <div className="bg-card border border-border rounded-lg shadow-md">
                  <ul className="flex flex-col py-2">
                    {item.children.map((child) => {
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
  )
}

export default HeaderMenu

