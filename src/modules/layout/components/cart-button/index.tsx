import { retrieveCart } from "@lib/data/cart"
import CartButtonClient from "./cart-button-client"

export default async function CartButton() {
  const cart = await retrieveCart().catch(() => null)

  return <CartButtonClient cart={cart} />
}
