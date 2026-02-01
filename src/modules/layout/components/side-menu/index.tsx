"use client"

import { Popover, PopoverButton, PopoverPanel, Transition } from "@headlessui/react"
import { XMark } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import { Fragment, Suspense, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { usePathname } from "next/navigation"
import { Plus, Minus, ChevronDown } from "lucide-react"
import ReactCountryFlag from "react-country-flag"
import { useRouter } from "next/navigation"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import MenuIcon from "@modules/common/icons/menu"
import { MegaMenuItem } from "../mega-menu-panel"
import { HttpTypes } from "@medusajs/types"
import { updateRegion } from "@lib/data/cart"

export interface MenuItem {
  id: string;
  label: string;
  url?: string | null;
  openInNewTab?: boolean;
  children?: MenuItem[];
}

export interface MegaMenuColors {
  lightBgColor?: string;
  darkBgColor?: string;
  lightHeadingColor?: string;
  darkHeadingColor?: string;
  lightItemBgColor?: string;
  darkItemBgColor?: string;
  lightItemTextColor?: string;
  darkItemTextColor?: string;
}

export interface SideMenuProps {
  regions: HttpTypes.StoreRegion[] | null;
  menuItems?: MegaMenuItem[];
  regionId?: string;
  customer?: HttpTypes.StoreCustomer | null;
  megaMenuColors?: MegaMenuColors;
}

const getRegionCookie = (): string => {
  if (typeof document === "undefined") return "ca"
  const match = document.cookie.match(/(?:^|; )_medusa_region=([^;]*)/)
  return match ? match[1] : "ca"
}

const SideMenu = ({ regions, menuItems, regionId, customer, megaMenuColors }: SideMenuProps) => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'))
    checkDark()
    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const mc = megaMenuColors
  const colors = {
    bg: (isDark ? mc?.darkBgColor : mc?.lightBgColor) || 'var(--mega-menu-bg, #1a1a1a)',
    heading: (isDark ? mc?.darkHeadingColor : mc?.lightHeadingColor) || 'var(--mega-menu-heading-color, #7bc67e)',
    itemBg: (isDark ? mc?.darkItemBgColor : mc?.lightItemBgColor) || 'var(--mega-menu-item-bg, #2a2a2a)',
    itemText: (isDark ? mc?.darkItemTextColor : mc?.lightItemTextColor) || 'var(--mega-menu-item-text, #e0e0e0)',
  }
  const pathname = usePathname()
  const router = useRouter()
  const closeRef = useRef<(() => void) | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [countryOpen, setCountryOpen] = useState(false)
  const [currentCountryCode, setCurrentCountryCode] = useState<string>("")

  // Build country options
  const countryOptions = (regions || [])
    .flatMap((r) =>
      (r.countries || []).map((c) => ({
        country: c.iso_2?.toUpperCase() || "",
        region: r.id,
        label: c.display_name || "",
      }))
    )
    .filter((o) => o.country.length === 2)
    .sort((a, b) => a.label.localeCompare(b.label))

  useEffect(() => {
    setCurrentCountryCode(getRegionCookie().toUpperCase())
  }, [])

  const selectedCountry = countryOptions.find((o) => o.country === currentCountryCode)

  const handleCountryChange = async (option: { country: string; region: string; label: string }) => {
    setCurrentCountryCode(option.country)
    setCountryOpen(false)
    await updateRegion(option.country.toLowerCase())
    router.refresh()
  }

  // 清除移动端文本选择状态（仅在移动端）
  useEffect(() => {
    const isMobile = () => {
      return window.innerWidth <= 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0
    }

    if (!isMobile()) return

    const clearSelection = () => {
      if (window.getSelection) {
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          selection.removeAllRanges()
        }
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('input') || target.closest('textarea')) return
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
        clearSelection()
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('input') || target.closest('textarea')) return
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

  const displayMenuItems: MegaMenuItem[] = menuItems && menuItems.length > 0
    ? menuItems
    : [
        { id: "home", label: "Home", url: "/" },
        { id: "store", label: "Store", url: "/products" },
        { id: "account", label: "Account", url: "/account" },
        { id: "cart", label: "Cart", url: "/cart" },
      ]

  const toggleExpand = (itemId: string) => {
    setExpandedId(prev => prev === itemId ? null : itemId)
  }

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => {
            closeRef.current = close

            return (
              <>
                <div className="relative flex h-full">
                  <PopoverButton
                    data-testid="nav-menu-button"
                    className="relative h-full flex items-center transition-all ease-out duration-200 focus:outline-none"
                    style={{ color: 'var(--header-icon-color, inherit)' }}
                  >
                    <MenuIcon className="w-6 h-6" />
                  </PopoverButton>
                </div>

                {typeof document !== 'undefined' && createPortal(
                  <>
                    {open && (
                      <div
                        className="fixed inset-0 z-[9997] bg-black/60 backdrop-blur-sm transition-opacity"
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
                        static
                        className="flex flex-col fixed top-0 left-0 w-[85%] sm:w-[400px] h-screen max-h-screen z-[9998] shadow-2xl"
                        style={{ backgroundColor: colors.bg }}
                      >
                        <div
                          data-testid="nav-menu-popup"
                          className="flex flex-col h-full min-h-0 relative"
                          style={{ backgroundColor: colors.bg }}
                        >
                          {/* Top Bar: Country Select + Close */}
                          <div className="flex justify-between items-center px-6 h-[60px] shrink-0" style={{ backgroundColor: colors.bg }}>
                            {/* Country Selector */}
                            {countryOptions.length > 0 && (
                              <div className="relative">
                                <button
                                  onClick={() => setCountryOpen(!countryOpen)}
                                  className="flex items-center gap-x-1.5 transition-opacity hover:opacity-70"
                                  style={{ color: colors.itemText }}
                                >
                                  {selectedCountry ? (
                                    <>
                                      <div className="flex-shrink-0" style={{ width: "16px", height: "16px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                        <ReactCountryFlag
                                          countryCode={selectedCountry.country}
                                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                        />
                                      </div>
                                      <span className="text-xs">{selectedCountry.country}</span>
                                    </>
                                  ) : (
                                    <span className="text-xs">Country</span>
                                  )}
                                  <ChevronDown size={12} className={`transition-transform ${countryOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {countryOpen && (
                                  <div
                                    className="absolute top-full left-0 mt-2 w-[220px] max-h-[300px] overflow-y-auto rounded-lg shadow-xl z-10"
                                    style={{ backgroundColor: colors.itemBg }}
                                  >
                                    <div className="p-1.5">
                                      {countryOptions.map((option, i) => (
                                        <button
                                          key={i}
                                          onClick={() => handleCountryChange(option)}
                                          className="w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-x-2 transition-opacity hover:opacity-70"
                                          style={{
                                            color: colors.itemText,
                                            backgroundColor: selectedCountry?.country === option.country ? colors.bg : 'transparent',
                                          }}
                                        >
                                          <div className="flex-shrink-0" style={{ width: "16px", height: "16px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                            <ReactCountryFlag
                                              countryCode={option.country}
                                              style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                            />
                                          </div>
                                          <span>{option.label}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            <button
                              data-testid="close-menu-button"
                              onClick={close}
                              className="p-1 transition-opacity hover:opacity-70"
                            >
                              <XMark
                                className="w-5 h-5"
                                style={{ color: colors.itemText }}
                              />
                            </button>
                          </div>

                          {/* Top divider */}
                          <div
                            className="h-px w-full shrink-0"
                            style={{ backgroundColor: colors.itemBg }}
                          />

                          {/* Menu Items - Scrollable */}
                          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar" style={{ backgroundColor: colors.bg }}>
                            <div className="px-6">
                              {displayMenuItems.map((item, index) => {
                                const hasChildren = item.children && item.children.length > 0
                                const isExpanded = expandedId === item.id
                                const itemUrl = item.url?.trim() || ""
                                const hasUrl = itemUrl !== ""

                                return (
                                  <div key={item.id}>
                                    {/* Menu Item Row */}
                                    <div className="flex items-center justify-between h-[56px]">
                                      <LocalizedClientLink
                                        href={item.url}
                                        className="transition-opacity hover:opacity-70"
                                        style={{
                                          color: colors.itemText,
                                          fontSize: '13px',
                                          fontWeight: 500,
                                          letterSpacing: '1px',
                                          textTransform: 'uppercase' as const,
                                        }}
                                        onClick={hasUrl ? close : undefined}
                                        data-testid={`${item.id}-link`}
                                        {...(item.openInNewTab && hasUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                      >
                                        {item.label}
                                      </LocalizedClientLink>

                                      {hasChildren && (
                                        <button
                                          onClick={() => toggleExpand(item.id)}
                                          className="w-6 h-6 flex items-center justify-center rounded transition-opacity hover:opacity-70"
                                          style={{
                                            border: `1px solid ${colors.heading}`,
                                          }}
                                          aria-label={isExpanded ? "Collapse" : "Expand"}
                                        >
                                          {isExpanded ? (
                                            <Minus size={16} style={{ color: colors.heading }} />
                                          ) : (
                                            <Plus size={16} style={{ color: colors.heading }} />
                                          )}
                                        </button>
                                      )}
                                    </div>

                                    {/* Expanded Content */}
                                    {hasChildren && isExpanded && (
                                      <div className="flex flex-col gap-6 pb-4 pt-2">
                                        {item.children!.map((child) => {
                                          const hasGrandchildren = child.children && child.children.length > 0

                                          return (
                                            <div key={child.id} className="flex flex-col gap-4">
                                              {/* Category Title */}
                                              <div>
                                                <span
                                                  className="text-xs font-bold uppercase block"
                                                  style={{
                                                    color: colors.heading,
                                                    letterSpacing: '1.5px',
                                                    fontSize: '13px',
                                                  }}
                                                >
                                                  {child.label}
                                                </span>
                                                <div
                                                  className="h-0.5 mt-2 w-full rounded"
                                                  style={{ backgroundColor: colors.heading }}
                                                />
                                              </div>

                                              {/* Grandchildren: 2-column equal-width grid */}
                                              {hasGrandchildren && (
                                                <div className="grid grid-cols-2 gap-3">
                                                  {child.children!.map((grandchild) => {
                                                    const gcUrl = grandchild.url?.trim() || ""
                                                    const hasGcUrl = gcUrl !== ""

                                                    return (
                                                      <LocalizedClientLink
                                                        key={grandchild.id}
                                                        href={grandchild.url}
                                                        className="flex items-center justify-center h-[36px] px-4 rounded-lg text-xs transition-opacity hover:opacity-80"
                                                        style={{
                                                          backgroundColor: colors.itemBg,
                                                          color: colors.itemText,
                                                        }}
                                                        onClick={hasGcUrl ? close : undefined}
                                                        {...(grandchild.openInNewTab && hasGcUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                                      >
                                                        {grandchild.label}
                                                      </LocalizedClientLink>
                                                    )
                                                  })}
                                                </div>
                                              )}
                                            </div>
                                          )
                                        })}

                                        {/* Banner Images (from this top-level item) */}
                                        {(item.image1Url || item.image2Url) && (
                                          <div className="flex flex-col gap-3">
                                            {item.image1Url && (
                                              <div className="rounded-xl overflow-hidden">
                                                <img
                                                  src={item.image1Url}
                                                  alt=""
                                                  className="w-full object-contain"
                                                />
                                              </div>
                                            )}
                                            {item.image2Url && (
                                              <div className="rounded-xl overflow-hidden">
                                                <img
                                                  src={item.image2Url}
                                                  alt=""
                                                  className="w-full object-contain"
                                                />
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Divider (not after last item) */}
                                    {index < displayMenuItems.length - 1 && (
                                      <div
                                        className="h-px w-full"
                                        style={{ backgroundColor: colors.itemBg }}
                                      />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* Footer - Login */}
                          <div
                            className="flex flex-col gap-y-3 px-6 py-4 shrink-0"
                            style={{ borderTop: `1px solid ${colors.itemBg}`, backgroundColor: colors.bg }}
                          >
                            <LocalizedClientLink
                              href="/account"
                              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors py-2 px-3 rounded-md text-center text-xs font-semibold"
                              onClick={close}
                              data-testid="mobile-login-button"
                            >
                              {customer ? "Account" : "Login"}
                            </LocalizedClientLink>

                            <Text
                              className="text-xs uppercase tracking-widest px-1"
                              style={{ color: colors.itemText, opacity: 0.5 }}
                            >
                              © {new Date().getFullYear()} Onahole Station
                            </Text>
                          </div>
                        </div>
                      </PopoverPanel>
                    </Transition>
                  </>,
                  document.body
                )}
              </>
            )
          }}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
