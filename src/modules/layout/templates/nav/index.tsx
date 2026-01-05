import { Suspense } from "react"

import { listRegions, getRegion } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import { retrieveCustomer } from "@lib/data/customer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import AccountButton from "@modules/layout/components/account-button"
import SideMenu from "@modules/layout/components/side-menu"
import HeaderMenu from "@modules/layout/components/header-menu"
import ThemeToggleButton from "@modules/layout/components/theme-toggle-button"
import SearchBox from "@modules/layout/components/search-box"
import { getMedusaConfig } from "@lib/admin-api/config"
import { clx } from "@medusajs/ui"
import User from "@modules/common/icons/user"

export default async function Nav() {
  const regions = await listRegions().then((regions: StoreRegion[]) => regions)
  const config = await getMedusaConfig()
  const headerConfig = config?.headerConfig
  const headerMenuItems = headerConfig?.menu?.menuItems || []
  
  // 获取默认区域 ID（使用第一个区域作为后备）
  const currentRegionId = regions && regions.length > 0 ? regions[0].id : undefined
  
  // 获取客户信息（用于侧边栏登录按钮）
  const customer = await retrieveCustomer().catch(() => null)
  
  // Branding settings
  const brand = headerConfig?.brand
  const logo = headerConfig?.logo
  const showBrandName = brand?.showBrandName !== false
  
  // Check if logo URLs are valid (not empty strings)
  const hasLightLogo = logo?.lightLogoUrl && logo.lightLogoUrl.trim() !== ''
  const hasDarkLogo = logo?.darkLogoUrl && logo.darkLogoUrl.trim() !== ''

  return (
    <div className="sticky top-0 inset-x-0 z-50">
      <header className="relative h-16 mx-auto border-b duration-200 bg-background/90 backdrop-blur-xl border-border overflow-visible">
        <nav className="content-container flex items-center justify-between w-full h-full text-foreground overflow-visible relative">
          {/* Left: Branding & Mobile Menu */}
          <div className="flex-1 basis-0 h-full flex items-center gap-x-4">
            <div className="h-full flex items-center small:hidden">
              <SideMenu regions={regions} menuItems={headerMenuItems} regionId={currentRegionId} customer={customer} />
            </div>
            
            <LocalizedClientLink
              href="/"
              className="flex items-center gap-x-2 transition-opacity hover:opacity-80"
              data-testid="nav-store-link"
            >
              {/* Logo */}
              {hasLightLogo && (
                <img
                  src={logo.lightLogoUrl}
                  alt={logo.logoAlt || "Logo"}
                  className={clx(
                    "w-auto object-contain dark:hidden",
                    logo.mobileHeightClass && logo.mobileHeightClass.trim() ? logo.mobileHeightClass : "h-8",
                    logo.desktopHeightClass && logo.desktopHeightClass.trim() ? logo.desktopHeightClass : "small:h-10"
                  )}
                />
              )}
              {hasDarkLogo && (
                <img
                  src={logo.darkLogoUrl}
                  alt={logo.logoAlt || "Logo"}
                  className={clx(
                    "w-auto object-contain hidden dark:block",
                    logo.mobileHeightClass && logo.mobileHeightClass.trim() ? logo.mobileHeightClass : "h-8",
                    logo.desktopHeightClass && logo.desktopHeightClass.trim() ? logo.desktopHeightClass : "small:h-10"
                  )}
                />
              )}
              {/* Fallback: Use light logo for dark mode if dark logo not available */}
              {hasLightLogo && !hasDarkLogo && (
                <img
                  src={logo.lightLogoUrl}
                  alt={logo.logoAlt || "Logo"}
                  className={clx(
                    "w-auto object-contain hidden dark:block",
                    logo.mobileHeightClass && logo.mobileHeightClass.trim() ? logo.mobileHeightClass : "h-8",
                    logo.desktopHeightClass && logo.desktopHeightClass.trim() ? logo.desktopHeightClass : "small:h-10"
                  )}
                />
              )}
              
              {/* Brand Name */}
              {showBrandName && (brand?.brandNamePart1 || brand?.brandNamePart2) && (
                <div className={clx(
                  "flex items-center font-bold",
                  brand.brandNameGapClass || "gap-1",
                  brand.brandNameSizeClass || "text-xl",
                  brand.brandNameTrackingClass || "tracking-tighter"
                )}>
                  {brand.brandNamePart1 && (
                    <span className={brand.brandNamePart1ColorClass || "text-foreground"}>
                      {brand.brandNamePart1}
                    </span>
                  )}
                  {brand.brandNamePart2 && (
                    <span className={brand.brandNamePart2ColorClass || "text-primary"}>
                      {brand.brandNamePart2}
                    </span>
                  )}
                </div>
              )}
              
              {/* Fallback Name if nothing configured */}
              {!hasLightLogo && !hasDarkLogo && !brand?.brandNamePart1 && !brand?.brandNamePart2 && (
                <span className="txt-compact-xlarge-plus uppercase text-foreground font-bold">
                  Onahole Station
                </span>
              )}
            </LocalizedClientLink>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-x-4 h-full flex-1 basis-0 justify-end">
            <div className="hidden small:flex items-center gap-x-4 h-full">
              <Suspense fallback={
                <div className="p-2">
                  <User size="20" />
                </div>
              }>
                <AccountButton />
              </Suspense>
            </div>
            <ThemeToggleButton />
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="p-2 text-ui-fg-subtle hover:text-ui-fg-base transition-colors flex items-center justify-center relative"
                  href="/cart"
                  aria-label="Cart"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3 6H21"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
      
      {/* Desktop Menu - Separate Container Below Header (NOT inside header) */}
      {headerMenuItems.length > 0 && (
        <div className="hidden small:block border-b border-border bg-background/90 backdrop-blur-xl relative z-40 overflow-visible">
          <div className="content-container flex items-center justify-center gap-x-8 py-1 overflow-visible">
            <HeaderMenu menuItems={headerMenuItems} />
            {/* Search Box in Menu */}
            <div className="relative z-[100]">
              <Suspense fallback={<div className="w-64 h-10" />}>
                <SearchBox variant="desktop" regionId={currentRegionId} />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
