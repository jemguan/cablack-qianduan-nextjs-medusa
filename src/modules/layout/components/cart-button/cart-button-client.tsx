"use client"

import dynamic from "next/dynamic"
import { HttpTypes } from "@medusajs/types"

// 动态导入客户端组件，禁用 SSR
const CartDropdown = dynamic(
  () => import("../cart-dropdown"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center p-2">
        <div className="w-5 h-5 border-2 border-ui-fg-subtle border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
)

const CartButtonClient = ({ cart }: { cart?: HttpTypes.StoreCart | null }) => {
  return <CartDropdown cart={cart} />
}

export default CartButtonClient

