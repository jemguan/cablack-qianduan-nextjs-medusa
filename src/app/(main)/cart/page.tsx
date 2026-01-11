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
  // 并行获取 cart 和 customer，减少等待时间
  const [cart, customer] = await Promise.all([
    retrieveCart().catch((error) => {
      console.error(error)
      return null
    }),
    retrieveCustomer(),
  ])

  if (!cart) {
    return notFound()
  }

  return <CartTemplate cart={cart} customer={customer} />
}
