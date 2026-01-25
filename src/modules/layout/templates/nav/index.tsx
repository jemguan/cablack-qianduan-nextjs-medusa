import { Suspense } from "react"
import Image from "next/image"

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
import HeaderCountrySelect from "@modules/layout/components/header-country-select"
import DynamicBackground from "@modules/layout/components/dynamic-background"
import { getMedusaConfig } from "@lib/admin-api/config"
import { clx } from "@medusajs/ui"
import { FaUser, FaShoppingBag } from "react-icons/fa"

export default async function Nav() {
  // 并行获取所有数据，减少等待时间
  const [regions, config, customer] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    getMedusaConfig(),
    retrieveCustomer().catch(() => null),
  ])
  
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
  
  // Background color settings
  const background = headerConfig?.background
  const hasCustomBackground = background?.lightBackgroundColor || background?.darkBackgroundColor

  return (
    <div className="sticky top-0 inset-x-0 z-50">
      <DynamicBackground
        as="header"
        lightBackgroundColor={background?.lightBackgroundColor}
        darkBackgroundColor={background?.darkBackgroundColor}
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
              {hasLightLogo && (
                <div 
                  className="logo-light-container relative w-auto dark:hidden"
                  style={{
                    height: `${logo.mobileHeightPx || 32}px`,
                  }}
                >
                  <Image
                    src={logo.lightLogoUrl!}
                    alt={logo.logoAlt || "Logo"}
                    width={120}
                    height={logo.mobileHeightPx || 32}
                    priority
                    unoptimized={true}
                    className="w-auto h-full object-contain"
                    sizes="120px"
                  />
                </div>
              )}
              {hasDarkLogo && (
                <div 
                  className="logo-dark-container relative w-auto hidden dark:block"
                  style={{
                    height: `${logo.mobileHeightPx || 32}px`,
                  }}
                >
                  <Image
                    src={logo.darkLogoUrl!}
                    alt={logo.logoAlt || "Logo"}
                    width={120}
                    height={logo.mobileHeightPx || 32}
                    priority
                    unoptimized={true}
                    className="w-auto h-full object-contain"
                    sizes="120px"
                  />
                </div>
              )}
              {hasLightLogo && !hasDarkLogo && (
                <div 
                  className="logo-fallback-container relative w-auto hidden dark:block"
                  style={{
                    height: `${logo.mobileHeightPx || 32}px`,
                  }}
                >
                  <Image
                    src={logo.lightLogoUrl!}
                    alt={logo.logoAlt || "Logo"}
                    width={120}
                    height={logo.mobileHeightPx || 32}
                    priority
                    unoptimized={true}
                    className="w-auto h-full object-contain"
                    sizes="120px"
                  />
                </div>
              )}
              <style dangerouslySetInnerHTML={{
                __html: `
                  @media (min-width: 768px) {
                    .logo-light-container,
                    .logo-dark-container,
                    .logo-fallback-container {
                      height: ${logo?.desktopHeightPx || 40}px !important;
                    }
                  }
                `
              }} />
              
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
                <FaUser size={20} style={{ color: 'var(--header-icon-color)' }} />
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
                  <FaShoppingBag size={20} />
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
