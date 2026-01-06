import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import CartTemplate from "@modules/cart/templates"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPageTitle } from "@lib/data/page-title-config"

// 禁用页面缓存，确保购物车价格实时更新
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const title = await getPageTitle("cart", { title: "Cart" })
  return {
    title,
    description: "View your cart",
  }
}

export default async function Cart() {
  const cart = await retrieveCart().catch((error) => {
    console.error(error)
    return notFound()
  })

  const customer = await retrieveCustomer()

  return <CartTemplate cart={cart} customer={customer} />
}
