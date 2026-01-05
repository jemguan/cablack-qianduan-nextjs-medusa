import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import MedusaCTA from "@modules/layout/components/medusa-cta"
import { getMedusaConfig } from "@lib/admin-api/config"
import { clx } from "@medusajs/ui"
import Image from "next/image"

export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const config = await getMedusaConfig()
  const checkoutConfig = config?.checkoutPageConfig

  // Store brand configuration
  const storeBrand = checkoutConfig?.storeBrand || {
    type: 'text' as const,
    text: {
      storeName: 'Medusa Store',
      textSize: 'text-xl',
      textColor: 'text-ui-fg-subtle',
    },
  }

  // Powered by configuration
  const poweredBy = checkoutConfig?.poweredBy || {
    enabled: true,
    text: 'Powered by Medusa & Next.js',
  }

  // Render store brand (logo or text)
  const renderStoreBrand = () => {
    if (storeBrand.type === 'logo' && storeBrand.logo) {
      const hasLightLogo = storeBrand.logo.lightLogoUrl && storeBrand.logo.lightLogoUrl.trim() !== ''
      const hasDarkLogo = storeBrand.logo.darkLogoUrl && storeBrand.logo.darkLogoUrl.trim() !== ''

      if (!hasLightLogo && !hasDarkLogo) {
        // Fallback to text if no logo
        return (
          <span className="txt-compact-xlarge-plus text-ui-fg-subtle hover:text-ui-fg-base uppercase">
            {storeBrand.text?.storeName || 'Medusa Store'}
          </span>
        )
      }

      return (
        <>
          {hasLightLogo && (
            <Image
              src={storeBrand.logo.lightLogoUrl}
              alt={storeBrand.logo.logoAlt || "Logo"}
              width={120}
              height={40}
              className={clx(
                "w-auto object-contain dark:hidden",
                storeBrand.logo.mobileHeightClass || "h-8",
                storeBrand.logo.desktopHeightClass || "small:h-10"
              )}
            />
          )}
          {hasDarkLogo && (
            <Image
              src={storeBrand.logo.darkLogoUrl}
              alt={storeBrand.logo.logoAlt || "Logo"}
              width={120}
              height={40}
              className={clx(
                "w-auto object-contain hidden dark:block",
                storeBrand.logo.mobileHeightClass || "h-8",
                storeBrand.logo.desktopHeightClass || "small:h-10"
              )}
            />
          )}
          {hasLightLogo && !hasDarkLogo && (
            <Image
              src={storeBrand.logo.lightLogoUrl}
              alt={storeBrand.logo.logoAlt || "Logo"}
              width={120}
              height={40}
              className={clx(
                "w-auto object-contain hidden dark:block",
                storeBrand.logo.mobileHeightClass || "h-8",
                storeBrand.logo.desktopHeightClass || "small:h-10"
              )}
            />
          )}
        </>
      )
    }

    // Text brand
    return (
      <span className={clx(
        "txt-compact-xlarge-plus hover:text-ui-fg-base uppercase",
        storeBrand.text?.textColor || "text-ui-fg-subtle",
        storeBrand.text?.textSize || "text-xl"
      )}>
        {storeBrand.text?.storeName || 'Medusa Store'}
      </span>
    )
  }

  return (
    <div className="w-full bg-background relative small:min-h-screen" data-testid="checkout-layout">
      <div className="h-16 bg-background border-b border-border">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart"
            className="text-small-semi text-ui-fg-base flex items-center gap-x-2 uppercase flex-1 basis-0"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="mt-px hidden small:block txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base ">
              Back to shopping cart
            </span>
            <span className="mt-px block small:hidden txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base">
              Back
            </span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="flex items-center"
            data-testid="store-link"
          >
            {renderStoreBrand()}
          </LocalizedClientLink>
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">{children}</div>
      {poweredBy.enabled && (
      <div className="py-4 w-full flex items-center justify-center">
          <MedusaCTA text={poweredBy.text} />
      </div>
      )}
    </div>
  )
}
