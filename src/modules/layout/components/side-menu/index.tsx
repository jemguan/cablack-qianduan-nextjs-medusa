"use client"

import { Popover, PopoverButton, PopoverPanel, Transition } from "@headlessui/react"
import { ArrowRightMini, XMark } from "@medusajs/icons"
import { Text, clx, useToggleState } from "@medusajs/ui"
import { Fragment, Suspense, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CountrySelect from "../country-select"
import MenuIcon from "@modules/common/icons/menu"
import SearchBox from "../search-box"
import { HttpTypes } from "@medusajs/types"
import { signout } from "@lib/data/customer"

// 默认菜单项（当没有配置时使用）
const DEFAULT_SIDE_MENU_ITEMS = {
  Home: "/",
  Store: "/products",
  Account: "/account",
  Cart: "/cart",
}

export interface MenuItem {
  id: string;
  label: string;
  url?: string | null;  // URL can be empty/null for non-clickable items
  openInNewTab?: boolean;
  children?: MenuItem[];
}

export interface SideMenuProps {
  regions: HttpTypes.StoreRegion[] | null;
  menuItems?: MenuItem[];
  regionId?: string;
  customer?: HttpTypes.StoreCustomer | null;
}

const SideMenu = ({ regions, menuItems, regionId, customer }: SideMenuProps) => {
  const toggleState = useToggleState()
  const pathname = usePathname()
  const closeRef = useRef<(() => void) | null>(null)

  // 清除移动端文本选择状态（仅在移动端）
  useEffect(() => {
    // 检测是否为移动设备
    const isMobile = () => {
      return window.innerWidth <= 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0
    }

    if (!isMobile()) {
      return // 桌面端不添加这些事件监听器
    }

    const clearSelection = () => {
      if (window.getSelection) {
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          selection.removeAllRanges()
        }
      }
      if (document.getSelection) {
        const selection = document.getSelection()
        if (selection && selection.rangeCount > 0) {
          selection.removeAllRanges()
        }
      }
    }

    // 监听触摸开始事件，清除文本选择
    const handleTouchStart = (e: TouchEvent) => {
      // 如果触摸的是可交互元素，清除选择
      const target = e.target as HTMLElement
      // 不要清除输入框的选择
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('input') || target.closest('textarea')) {
        return
      }
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
        clearSelection()
      }
    }

    // 监听触摸结束事件，清除文本选择
    const handleTouchEnd = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      // 不要清除输入框的选择
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('input') || target.closest('textarea')) {
        return
      }
      clearSelection()
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  // 当路由变化时自动关闭侧边栏
  useEffect(() => {
    if (closeRef.current) {
      closeRef.current()
    }
  }, [pathname])

  // 如果没有配置菜单项，使用默认菜单项
  const displayMenuItems: MenuItem[] = menuItems && menuItems.length > 0
    ? menuItems
    : Object.entries(DEFAULT_SIDE_MENU_ITEMS).map(([label, url]) => ({
        id: label.toLowerCase(),
        label,
        url,
        openInNewTab: false,
        children: undefined,
      }))

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => {
            // 保存 close 函数到 ref，以便在 useEffect 中使用
            closeRef.current = close

            return (
              <>
                <div className="relative flex h-full">
                  <PopoverButton
                    data-testid="nav-menu-button"
                    className="relative h-full flex items-center transition-all ease-out duration-200 focus:outline-none text-ui-fg-subtle hover:text-ui-fg-base"
                  >
                    <MenuIcon className="w-6 h-6" />
                  </PopoverButton>
                </div>

              {open && (
                <div
                  className="fixed inset-0 z-[50] bg-background/60 backdrop-blur-md transition-opacity"
                  onClick={close}
                  data-testid="side-menu-backdrop"
                />
              )}

              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in duration-200 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <PopoverPanel 
                  className="flex flex-col fixed top-0 left-0 w-[85%] sm:w-[400px] h-screen max-h-screen z-[100] bg-background border-r border-border shadow-2xl"
                >
                  <div
                    data-testid="nav-menu-popup"
                    className="flex flex-col h-full min-h-0 p-8 bg-background relative"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8 shrink-0">
                      <span className="text-xl font-bold text-foreground uppercase tracking-widest border-b-2 border-primary pb-1">Menu</span>
                      <button 
                        data-testid="close-menu-button" 
                        onClick={close}
                        className="p-2 rounded-full hover:bg-muted transition-colors text-ui-fg-subtle hover:text-ui-fg-base shrink-0"
                      >
                        <XMark className="w-6 h-6" />
                      </button>
                    </div>
                    
                    {/* Search Box */}
                    <div className="mb-6 pb-6 border-b border-border">
                      <div className="w-full">
                        <Suspense fallback={<div className="w-full h-10" />}>
                          <SearchBox variant="mobile" regionId={regionId} onSearchComplete={close} />
                        </Suspense>
                      </div>
                    </div>

                    {/* Menu Items - Scrollable Area */}
                    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-4">
                      <ul className="flex flex-col gap-y-6 items-start justify-start py-4">
                        {displayMenuItems.map((item) => {
                          const hasChildren = item.children && item.children.length > 0
                          const itemUrl = item.url?.trim() || ""
                          const hasUrl = itemUrl !== ""
                          const isActive = hasUrl && (pathname === itemUrl || pathname.startsWith(`${itemUrl}/`) || pathname.includes(`/${itemUrl.replace(/^\//, '')}`))

                          return (
                            <li key={item.id} className="w-full">
                              {hasChildren ? (
                                <div className="flex flex-col gap-4">
                                  <LocalizedClientLink
                                    href={item.url}
                                    className={clx(
                                      "text-2xl font-bold transition-all",
                                      hasUrl && "hover:pl-2",
                                      isActive ? "text-primary" : hasUrl ? "text-foreground hover:text-primary" : "text-muted-foreground"
                                    )}
                                    onClick={hasUrl ? close : undefined}
                                    data-testid={`${item.id}-link`}
                                    {...(item.openInNewTab && hasUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                  >
                                    {item.label}
                                  </LocalizedClientLink>
                                  {item.children && (
                                    <ul className="flex flex-col gap-3 ml-4 border-l-2 border-primary/20 pl-6 my-2">
                                      {item.children.map((child: MenuItem) => {
                                        const childUrl = child.url?.trim() || ""
                                        const hasChildUrl = childUrl !== ""
                                        const isChildActive = hasChildUrl && (pathname === childUrl || pathname.startsWith(`${childUrl}/`) || pathname.includes(`/${childUrl.replace(/^\//, '')}`))
                                        const hasGrandchildren = child.children && child.children.length > 0

                                        return (
                                          <li key={child.id}>
                                            <LocalizedClientLink
                                              href={child.url}
                                              className={clx(
                                                "text-lg transition-all",
                                                hasChildUrl && "hover:pl-2",
                                                isChildActive ? "text-primary font-semibold" : hasChildUrl ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground"
                                              )}
                                              onClick={hasChildUrl ? close : undefined}
                                              data-testid={`${child.id}-link`}
                                              {...(child.openInNewTab && hasChildUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                            >
                                              {child.label}
                                            </LocalizedClientLink>

                                            {/* 三级菜单 */}
                                            {hasGrandchildren && (
                                              <ul className="flex flex-col gap-2 ml-4 border-l border-primary/10 pl-4 mt-2">
                                                {child.children!.map((grandchild: MenuItem) => {
                                                  const grandchildUrl = grandchild.url?.trim() || ""
                                                  const hasGrandchildUrl = grandchildUrl !== ""
                                                  const isGrandchildActive = hasGrandchildUrl && (pathname === grandchildUrl || pathname.startsWith(`${grandchildUrl}/`) || pathname.includes(`/${grandchildUrl.replace(/^\//, '')}`))

                                                  return (
                                                    <li key={grandchild.id}>
                                                      <LocalizedClientLink
                                                        href={grandchild.url}
                                                        className={clx(
                                                          "text-base transition-all",
                                                          hasGrandchildUrl && "hover:pl-2",
                                                          isGrandchildActive ? "text-primary font-medium" : hasGrandchildUrl ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground"
                                                        )}
                                                        onClick={hasGrandchildUrl ? close : undefined}
                                                        data-testid={`${grandchild.id}-link`}
                                                        {...(grandchild.openInNewTab && hasGrandchildUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                                      >
                                                        {grandchild.label}
                                                      </LocalizedClientLink>
                                                    </li>
                                                  )
                                                })}
                                              </ul>
                                            )}
                                          </li>
                                        )
                                      })}
                                    </ul>
                                  )}
                                </div>
                              ) : (
                                <LocalizedClientLink
                                  href={item.url}
                                  className={clx(
                                    "text-2xl font-bold transition-all",
                                    hasUrl && "hover:pl-2",
                                    isActive ? "text-primary" : hasUrl ? "text-foreground hover:text-primary" : "text-muted-foreground"
                                  )}
                                  onClick={hasUrl ? close : undefined}
                                  data-testid={`${item.id}-link`}
                                  {...(item.openInNewTab && hasUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                >
                                  {item.label}
                                </LocalizedClientLink>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </div>

                    {/* Footer - Fixed at Bottom */}
                    <div className="flex flex-col gap-y-6 pt-6 border-t border-border shrink-0 mt-auto relative z-10 bg-background">
                      {/* Login/Account Button */}
                      <LocalizedClientLink
                        href="/account"
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors py-3 px-4 rounded-lg text-center font-semibold"
                        onClick={close}
                        data-testid="mobile-login-button"
                      >
                        {customer ? "Account" : "Login"}
                      </LocalizedClientLink>

                      <div
                        className="flex justify-between items-center group cursor-pointer p-4 rounded-lg bg-muted/30 hover:bg-muted transition-colors"
                        onMouseEnter={toggleState.open}
                        onMouseLeave={toggleState.close}
                      >
                        {regions && (
                          <div className="flex-1 min-w-0">
                            <CountrySelect
                              toggleState={toggleState}
                              regions={regions}
                            />
                          </div>
                        )}
                        <ArrowRightMini
                          className={clx(
                            "transition-transform duration-150 text-muted-foreground group-hover:text-foreground shrink-0",
                            toggleState.state ? "-rotate-90" : ""
                          )}
                        />
                      </div>
                      
                      <div className="flex flex-col gap-y-4 px-2">
                        <Text className="text-muted-foreground text-xs uppercase tracking-widest">
                          © {new Date().getFullYear()} Onahole Station
                        </Text>
                      </div>
                    </div>
                  </div>
                </PopoverPanel>
              </Transition>
              </>
            )
          }}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
