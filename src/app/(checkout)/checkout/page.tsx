import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getPageTitle } from "@lib/data/page-title-config"

// 禁用页面缓存，确保购物车价格实时更新
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const title = await getPageTitle("checkout", { title: "Checkout" })
  return {
    title,
  }
}

export default async function Checkout() {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  // 并行获取所有需要的数据，避免 Suspense 导致的闪烁
  const [customer, shippingMethods, paymentMethods] = await Promise.all([
    retrieveCustomer(),
    listCartShippingMethods(cart.id),
    listCartPaymentMethods(cart.region?.id ?? ""),
  ])

  // 如果必要数据缺失，返回 404
  if (!shippingMethods || !paymentMethods) {
    return notFound()
  }

  return (
    <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-40 py-12">
      <PaymentWrapper cart={cart}>
        <CheckoutForm 
          cart={cart} 
          customer={customer}
          shippingMethods={shippingMethods}
          paymentMethods={paymentMethods}
        />
      </PaymentWrapper>
      <CheckoutSummary cart={cart} />
    </div>
  )
}
