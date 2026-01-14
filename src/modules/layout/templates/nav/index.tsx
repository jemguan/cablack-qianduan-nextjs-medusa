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

  return (
    <div className="sticky top-0 inset-x-0 z-50">
      <header className="relative h-16 mx-auto border-b duration-200 bg-background/90 backdrop-blur-xl border-border overflow-visible z-50">
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
              {/* Logo - 使用 Next.js Image 组件优化加载 */}
              {hasLightLogo && (
                <div className={clx(
                  "relative w-auto dark:hidden",
                  logo.mobileHeightClass && logo.mobileHeightClass.trim() ? logo.mobileHeightClass : "h-8",
                  logo.desktopHeightClass && logo.desktopHeightClass.trim() ? logo.desktopHeightClass : "small:h-10"
                )}>
                  <Image
                    src={logo.lightLogoUrl!}
                    alt={logo.logoAlt || "Logo"}
                    width={120}
                    height={40}
                    priority
                    className="w-auto h-full object-contain"
                    sizes="120px"
                  />
                </div>
              )}
              {hasDarkLogo && (
                <div className={clx(
                  "relative w-auto hidden dark:block",
                  logo.mobileHeightClass && logo.mobileHeightClass.trim() ? logo.mobileHeightClass : "h-8",
                  logo.desktopHeightClass && logo.desktopHeightClass.trim() ? logo.desktopHeightClass : "small:h-10"
                )}>
                  <Image
                    src={logo.darkLogoUrl!}
                    alt={logo.logoAlt || "Logo"}
                    width={120}
                    height={40}
                    priority
                    className="w-auto h-full object-contain"
                    sizes="120px"
                  />
                </div>
              )}
              {/* Fallback: Use light logo for dark mode if dark logo not available */}
              {hasLightLogo && !hasDarkLogo && (
                <div className={clx(
                  "relative w-auto hidden dark:block",
                  logo.mobileHeightClass && logo.mobileHeightClass.trim() ? logo.mobileHeightClass : "h-8",
                  logo.desktopHeightClass && logo.desktopHeightClass.trim() ? logo.desktopHeightClass : "small:h-10"
                )}>
                  <Image
                    src={logo.lightLogoUrl!}
                    alt={logo.logoAlt || "Logo"}
                    width={120}
                    height={40}
                    priority
                    className="w-auto h-full object-contain"
                    sizes="120px"
                  />
                </div>
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
                <FaUser size={20} />
              </div>
            }>
              <div className="hidden small:flex items-center h-full relative">
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
                >
                  <FaShoppingBag size={20} />
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
            {regions && regions.length > 0 && (
              <HeaderCountrySelect regions={regions} />
            )}
          </div>
        </nav>
      </header>
      
      {/* Desktop Menu - Separate Container Below Header (NOT inside header) */}
      {headerMenuItems.length > 0 && (
        <div className="hidden small:block border-b border-border bg-background/90 backdrop-blur-xl relative z-40 overflow-visible">
          <div className="content-container flex items-center justify-center gap-x-8 py-1 overflow-visible">
            <HeaderMenu menuItems={headerMenuItems} />
          </div>
        </div>
      )}
    </div>
  )
}
