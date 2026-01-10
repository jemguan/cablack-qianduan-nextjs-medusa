import { NextRequest, NextResponse } from "next/server"
import { sdk } from "@lib/config"
import { getAuthHeaders } from "@lib/data/cookies"
import medusaError from "@lib/util/medusa-error"

/**
 * 更新购物车的 Affiliate Code metadata
 * PUT /api/cart/[id]/affiliate
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cartId = params.id
    const body = await request.json()
    const { affiliate_code } = body

    if (!affiliate_code) {
      return NextResponse.json(
        { message: "affiliate_code is required" },
        { status: 400 }
      )
    }

    const headers = {
      ...(await getAuthHeaders()),
    }

    // 获取当前购物车
    const cartResponse = await sdk.client.fetch(
      `/store/carts/${cartId}`,
      {
        method: "GET",
        headers,
      }
    )

    if (!cartResponse.ok) {
      throw new Error("Failed to fetch cart")
    }

    const cart = await cartResponse.json()

    // 更新购物车 metadata
    const updateResponse = await sdk.store.cart.update(
      cartId,
      {
        metadata: {
          ...cart.cart.metadata,
          affiliate_code: affiliate_code,
        },
      },
      {},
      headers
    )

    return NextResponse.json({
      cart: updateResponse.cart,
    })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    )
  }
}
