import { Metadata } from "next"

import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { hasAuthToken, hasCartId } from "@lib/data/cookies"
import { getBaseURL } from "@lib/util/env"
import { StoreCartShippingOption } from "@medusajs/types"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"
import { ScrollToTop } from "@components/ScrollToTop"
import { WishlistProvider } from "@lib/context/wishlist-context"
import { RestockNotifyProvider } from "@lib/context/restock-notify-context"

// 强制动态渲染 - 避免构建时因后端不可用而失败
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  // 先检查 cookie 是否存在，避免不必要的 API 调用
  const [hasAuth, hasCart] = await Promise.all([
    hasAuthToken(),
    hasCartId(),
  ])

  // 条件性获取数据 - 只在有对应 cookie 时才发起 API 请求
  const [customer, cart] = await Promise.all([
    hasAuth ? retrieveCustomer() : Promise.resolve(null),
    hasCart ? retrieveCart() : Promise.resolve(null),
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
            variant="progress-bar"
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
