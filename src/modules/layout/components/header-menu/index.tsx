"use client"

import React from "react"
import { usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@medusajs/ui"

interface MenuItem {
  id: string
  label: string
  url: string
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
        const isActive = pathname === item.url || 
                        pathname.startsWith(`${item.url}/`) ||
                        pathname.includes(`/${item.url.replace(/^\//, '')}`)
        
        return (
          <div key={item.id} className="relative group flex items-center">
            <LocalizedClientLink
              href={item.url}
              className={clx(
                "text-small-regular transition-all duration-200 hover:text-foreground py-1",
                isActive ? "text-foreground font-semibold" : "text-muted-foreground"
              )}
              {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {item.label}
            </LocalizedClientLink>
            
            {/* Hover indicator */}
            <div className={clx(
              "absolute bottom-0 left-0 w-full h-0.5 bg-primary transition-all duration-200 transform scale-x-0 group-hover:scale-x-100",
              isActive && "scale-x-100"
            )} />

            {/* Submenu if exists */}
            {item.children && item.children.length > 0 && (
              <div className="absolute top-full left-0 hidden group-hover:block pt-2 min-w-[200px] z-50">
                <div className="bg-card border border-border rounded-lg shadow-md overflow-hidden">
                  <ul className="flex flex-col py-2">
                    {item.children.map((child) => {
                      const isChildActive = pathname === child.url || pathname.startsWith(`${child.url}/`)
                      return (
                        <li key={child.id}>
                          <LocalizedClientLink
                            href={child.url}
                            className={clx(
                              "block px-4 py-2 text-small-regular transition-all",
                              isChildActive 
                                ? "text-primary font-semibold bg-muted/30" 
                                : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                            )}
                            {...(child.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                          >
                            {child.label}
                          </LocalizedClientLink>
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

