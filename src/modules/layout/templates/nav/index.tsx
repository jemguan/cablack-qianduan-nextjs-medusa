import { Suspense } from "react"

import { listRegions, getRegion } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import { retrieveCustomer } from "@lib/data/customer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import AccountButton from "@modules/layout/components/account-button"
import SideMenu from "@modules/layout/components/side-menu"
import HeaderMenu from "@modules/layout/components/header-menu"
import HeaderInlineMenu from "@modules/layout/components/header-inline-menu"
import ThemeToggleButton from "@modules/layout/components/theme-toggle-button"
import SearchBox from "@modules/layout/components/search-box"
import HeaderCountrySelect from "@modules/layout/components/header-country-select"
import DynamicBackground from "@modules/layout/components/dynamic-background"
import PreviewLogo from "@modules/layout/components/preview-logo"
import PreviewBrandName from "@modules/layout/components/preview-brand-name"
import { getMedusaConfig } from "@lib/admin-api/config"
import { clx } from "@medusajs/ui"
import { User, ShoppingBag } from "lucide-react"

export default async function Nav() {
  // 并行获取所有数据，减少等待时间
  const [regions, config, customer] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    getMedusaConfig(),
    retrieveCustomer().catch(() => null),
  ])

  const headerConfig = config?.headerConfig
  const headerMenuItems = headerConfig?.menu?.menuItems || []
  const headerStyle = headerConfig?.style?.headerStyle || 'classic'
  const isInline = headerStyle === 'inline'

  // 获取默认区域 ID（使用第一个区域作为后备）
  const currentRegionId = regions && regions.length > 0 ? regions[0].id : undefined

  // Branding settings
  const brand = headerConfig?.brand
  const logo = headerConfig?.logo

  // Background color settings
  const background = headerConfig?.background
  const hasCustomBackground = background?.lightBackgroundColor || background?.darkBackgroundColor

  if (isInline) {
    // Inline style: single row - Brand(left) + Menu(center) + Actions(right)
    return (
      <div className="sticky top-0 inset-x-0 z-50">
        <DynamicBackground
          as="header"
          lightBackgroundColor={background?.lightBackgroundColor}
          darkBackgroundColor={background?.darkBackgroundColor}
          previewConfigKey="header"
          className={clx(
            "relative mx-auto duration-200 overflow-visible z-50",
            !hasCustomBackground && "bg-background/90 backdrop-blur-xl"
          )}
        >
          <nav
            className="content-container flex items-stretch w-full text-foreground overflow-visible relative"
            style={{ color: 'var(--header-text-color)', minHeight: '56px' }}
          >
            {/* Left: Mobile Menu + Branding */}
            <div className="flex items-center gap-x-4 shrink-0">
              <div className="h-full flex items-center small:hidden">
                <SideMenu regions={regions} menuItems={headerMenuItems} regionId={currentRegionId} customer={customer} />
              </div>

              <LocalizedClientLink
                href="/"
                className="flex items-center gap-x-2 transition-opacity hover:opacity-80 hover:text-[var(--header-link-hover-color)]"
                data-testid="nav-store-link"
              >
                <PreviewLogo serverConfig={logo} type="header" />
                <PreviewBrandName
                  serverConfig={brand}
                  serverLogoConfig={logo}
                  type="header"
                  fallbackName="Onahole Station"
                />
              </LocalizedClientLink>
            </div>

            {/* Center: Inline Menu */}
            {headerMenuItems.length > 0 && (
              <div className="flex-1 flex items-stretch justify-center overflow-visible">
                <HeaderInlineMenu menuItems={headerMenuItems} />
              </div>
            )}

            {/* Right: Actions */}
            <div className="flex items-center gap-x-4 shrink-0">
              <Suspense fallback={<div className="hidden small:flex p-2"><SearchIcon /></div>}>
                <div className="hidden small:flex items-center" style={{ color: 'var(--header-icon-color)' }}>
                  <SearchBox variant="desktop" regionId={currentRegionId} defaultExpanded={false} />
                </div>
              </Suspense>
              <Suspense fallback={
                <div className="hidden small:flex p-2">
                  <User size={20} style={{ color: 'var(--header-icon-color)' }} />
                </div>
              }>
                <div className="hidden small:flex items-center h-full relative" style={{ color: 'var(--header-icon-color)' }}>
                  <AccountButton />
                </div>
              </Suspense>
              <ThemeToggleButton />
              <Suspense
                fallback={
                  <LocalizedClientLink
                    className="p-2 text-ui-fg-subtle hover:text-ui-fg-base transition-colors flex items-center justify-center relative"
                    href="/cart"
                    aria-label="Cart"
                    style={{ color: 'var(--header-icon-color)' }}
                  >
                    <ShoppingBag size={20} />
                  </LocalizedClientLink>
                }
              >
                <div style={{ color: 'var(--header-icon-color)' }}>
                  <CartButton />
                </div>
              </Suspense>
              {regions && regions.length > 0 && (
                <HeaderCountrySelect regions={regions} />
              )}
            </div>
          </nav>
        </DynamicBackground>
      </div>
    )
  }

  // Classic style: original two-row layout
  return (
    <div className="sticky top-0 inset-x-0 z-50">
      <DynamicBackground
        as="header"
        lightBackgroundColor={background?.lightBackgroundColor}
        darkBackgroundColor={background?.darkBackgroundColor}
        previewConfigKey="header"
        className={clx(
          "relative mx-auto duration-200 overflow-visible z-50",
          !hasCustomBackground && "bg-background/90 backdrop-blur-xl"
        )}
      >
        <nav
          className="content-container flex items-center justify-between w-full py-3 small:py-4 text-foreground overflow-visible relative"
          style={{ color: 'var(--header-text-color)' }}
        >
          {/* Left: Branding & Mobile Menu */}
          <div className="flex-1 basis-0 h-full flex items-center gap-x-4">
            <div className="h-full flex items-center small:hidden">
              <SideMenu regions={regions} menuItems={headerMenuItems} regionId={currentRegionId} customer={customer} />
            </div>

            <LocalizedClientLink
              href="/"
              className="flex items-center gap-x-2 transition-opacity hover:opacity-80 hover:text-[var(--header-link-hover-color)]"
              data-testid="nav-store-link"
            >
              <PreviewLogo serverConfig={logo} type="header" />
              <PreviewBrandName
                serverConfig={brand}
                serverLogoConfig={logo}
                type="header"
                fallbackName="Onahole Station"
              />
            </LocalizedClientLink>
          </div>

          {/* Center: Search Box */}

          <div className="hidden small:flex flex-1 justify-center items-center px-4">
            <Suspense fallback={<div className="w-full max-w-2xl h-10" />}>
              <SearchBox variant="desktop" regionId={currentRegionId} defaultExpanded={true} />
            </Suspense>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-x-4 h-full flex-1 basis-0 justify-end">
            <Suspense fallback={
              <div className="hidden small:flex p-2">
                <User size={20} style={{ color: 'var(--header-icon-color)' }} />
              </div>
            }>
              <div className="hidden small:flex items-center h-full relative" style={{ color: 'var(--header-icon-color)' }}>
                <AccountButton />
              </div>
            </Suspense>
            <ThemeToggleButton />
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="p-2 text-ui-fg-subtle hover:text-ui-fg-base transition-colors flex items-center justify-center relative"
                  href="/cart"
                  aria-label="Cart"
                  style={{ color: 'var(--header-icon-color)' }}
                >
                  <ShoppingBag size={20} />
                </LocalizedClientLink>
              }
            >
              <div style={{ color: 'var(--header-icon-color)' }}>
                <CartButton />
              </div>
            </Suspense>
            {regions && regions.length > 0 && (
              <HeaderCountrySelect regions={regions} />
            )}
          </div>
        </nav>
      </DynamicBackground>

      {/* Desktop Menu - Separate Container Below Header (NOT inside header) */}
      {headerMenuItems.length > 0 && (
        <DynamicBackground
          lightBackgroundColor={background?.lightBackgroundColor}
          darkBackgroundColor={background?.darkBackgroundColor}
          previewConfigKey="header"
          className={clx(
            "hidden small:block relative z-40 overflow-visible",
            !hasCustomBackground && "bg-background/90 backdrop-blur-xl"
          )}
        >
          <div className="content-container flex items-center justify-center gap-x-8 py-1 overflow-visible">
            <HeaderMenu menuItems={headerMenuItems} />
          </div>
        </DynamicBackground>
      )}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.35-4.35"></path>
    </svg>
  )
}
