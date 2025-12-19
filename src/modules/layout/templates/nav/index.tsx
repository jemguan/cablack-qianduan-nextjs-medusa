import { Suspense } from "react"

import { listRegions, getRegion } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import HeaderMenu from "@modules/layout/components/header-menu"
import ThemeToggleButton from "@modules/layout/components/theme-toggle-button"
import SearchBox from "@modules/layout/components/search-box"
import { getMedusaConfig } from "@lib/admin-api/config"
import { clx } from "@medusajs/ui"

export default async function Nav() {
  const regions = await listRegions().then((regions: StoreRegion[]) => regions)
  const config = await getMedusaConfig()
  const headerConfig = config?.headerConfig
  const headerMenuItems = headerConfig?.menu?.menuItems || []
  
  // 获取默认区域 ID（使用第一个区域作为后备）
  const currentRegionId = regions && regions.length > 0 ? regions[0].id : undefined
  
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
              <SideMenu regions={regions} menuItems={headerMenuItems} />
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
                  Medusa Store
                </span>
              )}
            </LocalizedClientLink>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-x-4 h-full flex-1 basis-0 justify-end">
            <div className="hidden small:flex items-center gap-x-4 h-full">
              <LocalizedClientLink
                className="text-small-regular text-ui-fg-subtle hover:text-ui-fg-base transition-colors"
                href="/account"
                data-testid="nav-account-link"
              >
                Account
              </LocalizedClientLink>
            </div>
            <ThemeToggleButton />
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="text-small-regular text-ui-fg-subtle hover:text-ui-fg-base transition-colors flex items-center h-10 px-2"
                  href="/cart"
                >
                  Cart (0)
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
      {/* Mobile Search Box */}
      <div className="small:hidden border-b border-border bg-background/90 backdrop-blur-xl relative z-40 overflow-visible">
        <div className="content-container flex items-center justify-center py-2 overflow-visible">
          <div className="relative z-[100] w-full max-w-md">
            <Suspense fallback={<div className="w-full h-10" />}>
              <SearchBox variant="mobile" regionId={currentRegionId} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
