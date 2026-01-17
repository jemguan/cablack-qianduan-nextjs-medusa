import { Metadata } from "next"

import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getBaseURL } from "@lib/util/env"
import { StoreCartShippingOption } from "@medusajs/types"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"
import { ScrollToTop } from "@components/ScrollToTop"
import { WishlistProvider } from "@lib/context/wishlist-context"
import { RestockNotifyProvider } from "@lib/context/restock-notify-context"

// 页面级别缓存设置（5分钟）
// 注意：购物车页面和结账页面有各自的 force-dynamic 设置，不受此影响
export const revalidate = 300

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  // 并行获取 customer 和 cart，减少等待时间
  const [customer, cart] = await Promise.all([
    retrieveCustomer(),
    retrieveCart(),
  ])
  
  // 只有在有购物车时才获取配送选项
  const shippingOptions: StoreCartShippingOption[] = cart
    ? (await listCartOptions()).shipping_options
    : []

  return (
    <WishlistProvider customer={customer}>
      <RestockNotifyProvider customer={customer}>
        <ScrollToTop />
        <Nav />
        {customer && cart && (
          <CartMismatchBanner customer={customer} cart={cart} />
        )}

        {cart && (
          <FreeShippingPriceNudge
            variant="popup"
            cart={cart}
            shippingOptions={shippingOptions}
          />
        )}
        {props.children}
        <Footer />
      </RestockNotifyProvider>
    </WishlistProvider>
  )
}
