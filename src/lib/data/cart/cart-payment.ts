"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { getAuthHeaders, getCartId, getCacheTag, removeCartId } from "../cookies"
import { retrieveCart } from "./cart-retrieval"
import { revalidateCartCache, revalidateProductInventoryCache } from "./cart-cache"
import { revalidateTag } from "next/cache"

/**
 * 初始化支付会话
 */
export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart | string,
  data: HttpTypes.StoreInitializePaymentSession
) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    // If cart is a string (cart ID), retrieve the cart first
    let cartObj: HttpTypes.StoreCart
    if (typeof cart === "string") {
      // Retrieve cart with payment_collection fields
      const retrievedCart = await retrieveCart(
        cart,
        "*items, *region, *items.product, *items.variant, *items.variant.images, *items.thumbnail, *items.metadata, +items.total, *promotions, +shipping_methods.name, *payment_collection, *payment_collection.payment_sessions"
      )
      if (!retrievedCart) {
        throw new Error("Cart not found. Please refresh the page and try again.")
      }
      cartObj = retrievedCart
    } else {
      cartObj = cart
    }

    // 验证购物车是否有必要的字段
    if (!cartObj.region_id) {
      throw new Error("Cart region is missing. Please refresh the page and try again.")
    }

    if (!cartObj.id) {
      throw new Error("Cart ID is missing. Please refresh the page and try again.")
    }

    // 只传递必要的字段，避免序列化问题
    // 创建一个最小化的购物车对象，只包含 API 需要的字段
    const minimalCart = {
      id: cartObj.id,
      region_id: cartObj.region_id,
      // 如果 payment_collection 存在，也传递它（但只传递必要的字段）
      ...(cartObj.payment_collection && {
        payment_collection: {
          id: cartObj.payment_collection.id,
        },
      }),
    }

    const resp = await sdk.store.payment.initiatePaymentSession(
      minimalCart as HttpTypes.StoreCart,
      data,
      {},
      headers
    )

    await revalidateCartCache()

    // 确保返回值可以被序列化（Next.js Server Actions 要求）
    // 只返回必要的字段，避免包含不可序列化的内容
    if (resp && typeof resp === 'object') {
      // 返回一个可序列化的对象
      return JSON.parse(JSON.stringify(resp))
    }

    return resp
  } catch (error: any) {
    // 提取友好的错误信息
    let errorMessage = "Failed to initialize payment session"

    // 记录错误日志（生产环境也记录，但不暴露敏感信息）
    try {
      if (error?.response) {
        // 处理 HTTP 响应错误
        const status = error.response.status
        const responseData = error.response.data

        // 记录详细错误信息
        console.error("initiatePaymentSession error:", {
          status,
          url: error?.config?.url,
          method: error?.config?.method,
          responseData: typeof responseData === "object"
            ? JSON.stringify(responseData).substring(0, 500)
            : String(responseData).substring(0, 500),
        })

        if (status === 500) {
          // 检查是否是 Stripe 客户不存在错误
          const responseStr = typeof responseData === "string"
            ? responseData
            : JSON.stringify(responseData)

          if (responseStr.includes("No such customer") || responseStr.includes("customer")) {
            errorMessage = "Payment account error detected. Please refresh the page and try again. If the problem persists, please contact support."
          } else {
            errorMessage = "Payment service is temporarily unavailable. Please try again in a moment or contact support."
          }
        } else if (status === 401 || status === 403) {
          errorMessage = "Authentication failed. Please refresh the page and try again."
        } else if (status === 404) {
          errorMessage = "Payment method not found. Please refresh the page and try again."
        } else if (responseData?.message) {
          const msg = typeof responseData.message === "string"
            ? responseData.message
            : JSON.stringify(responseData.message)
          errorMessage = msg.substring(0, 200) // 限制长度避免序列化问题
        } else if (responseData) {
          errorMessage = typeof responseData === "string"
            ? responseData.substring(0, 200)
            : "Payment initialization failed. Please try again."
        }
      } else if (error?.message) {
        const errorMsg = String(error.message)
        // 检查是否是 Stripe 客户不存在错误
        if (errorMsg.includes("No such customer") || errorMsg.includes("customer")) {
          errorMessage = "Payment account error detected. Please refresh the page and try again. If the problem persists, please contact support."
        } else {
          errorMessage = errorMsg.substring(0, 200)
        }
        console.error("initiatePaymentSession error:", {
          message: errorMessage,
          errorType: error?.name || "Unknown",
          ...(process.env.NODE_ENV === "development" && error?.stack
            ? { stack: error.stack.substring(0, 500) }
            : {}),
        })
      } else {
        errorMessage = String(error).substring(0, 200)
        console.error("initiatePaymentSession error:", {
          error: errorMessage,
          type: typeof error,
        })
      }
    } catch (logError) {
      // 如果记录日志时出错，至少记录基本信息
      console.error("initiatePaymentSession: Failed to log error details", logError)
      errorMessage = "An unexpected error occurred. Please try again."
    }

    // 抛出友好的错误信息（确保错误可以被序列化）
    // 只抛出纯字符串错误，避免序列化问题
    throw new Error(errorMessage)
  }
}

/**
 * Places an order for a cart. If no cart ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to place an order for.
 * @returns The cart object if the order was successful, or null if not.
 */
export async function placeOrder(cartId?: string) {
  const id = cartId || (await getCartId())

  if (!id) {
    throw new Error("No existing cart found when placing an order")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  // 在完成订单前，先刷新购物车状态以确保 shipping method 仍然有效
  try {
    const currentCart = await retrieveCart(
      id,
      "*items, *region, *items.product, *items.variant, *shipping_methods, *payment_collection, *payment_collection.payment_sessions"
    )

    if (!currentCart) {
      throw new Error("Cart not found")
    }

    // 验证购物车是否准备好完成订单
    if (!currentCart.shipping_address) {
      throw new Error("Shipping address is required")
    }

    if (!currentCart.billing_address) {
      throw new Error("Billing address is required")
    }

    if (!currentCart.email) {
      throw new Error("Email is required")
    }

    if (!currentCart.shipping_methods || currentCart.shipping_methods.length === 0) {
      throw new Error("Shipping method is required. Please select a shipping method.")
    }

    // 检查购物车总金额
    // 对于零金额订单（使用积分、礼品卡或100%折扣），使用 Manual System Payment Provider，可能没有支付会话
    const cartTotal = currentCart.total || 0

    // 仅对非零金额订单检查支付会话
    if (cartTotal > 0) {
      if (!currentCart.payment_collection?.payment_sessions || currentCart.payment_collection.payment_sessions.length === 0) {
        throw new Error("Payment session is required")
      }

      // 检查支付会话状态 - 放宽检查条件
      // Stripe 支付成功后，状态可能是 "authorized", "requires_more", "pending" (如果 webhook 还未处理)
      // 只要不是 "error" 或 "canceled"，都允许继续
      const paymentSessions = currentCart.payment_collection.payment_sessions
      const validPaymentSession = paymentSessions.find(
        (session) => {
          const status = session.status?.toLowerCase()
          // 允许的状态：authorized, requires_more, pending (Stripe 支付成功后可能还是 pending，等待 webhook)
          // 不允许的状态：error, canceled, null/undefined
          return status &&
            status !== "error" &&
            status !== "canceled" &&
            (status === "authorized" ||
              status === "requires_more" ||
              status === "pending" ||
              status === "requires_action")
        }
      )

      if (!validPaymentSession) {
        // 检查是否有 Stripe 支付会话
        const stripeSession = paymentSessions.find(s => s.provider_id === "stripe")
        if (stripeSession) {
          // 对于 Stripe，如果状态是 pending，可能是 webhook 还未处理，允许继续尝试
          // Medusa 会在 complete 时验证支付状态
          if (stripeSession.status === "pending") {
            // 允许继续，Medusa 会在 complete 时验证
          } else {
            throw new Error(`Payment session status is ${stripeSession.status}. Please complete the payment first.`)
          }
        } else {
          throw new Error("No valid payment session found. Please complete the payment first.")
        }
      }
    }
  } catch (error: any) {
    // 如果是验证错误，直接抛出
    if (error.message && (
      error.message.includes("required") ||
      error.message.includes("not authorized") ||
      error.message.includes("not found") ||
      error.message.includes("Payment session")
    )) {
      throw error
    }
    // 其他错误继续处理，可能是网络问题
    console.error("Error validating cart before placing order:", error)
  }

  const cartRes = await sdk.store.cart
    .complete(id, {}, headers)
    .then(async (cartRes) => {
      await revalidateCartCache()

      // 失效产品库存缓存，因为下单会消耗库存
      await revalidateProductInventoryCache()

      return cartRes
    })
    .catch((error: any) => {
      // 提供更友好的错误信息
      const errorMessage = error?.message || ""

      if (errorMessage.includes("shipping profiles") || errorMessage.includes("shipping methods")) {
        throw new Error("The selected shipping method is no longer valid for the items in your cart. Please go back and select a different shipping method.")
      }

      // 处理支付会话删除错误 - 这通常不影响订单完成
      if (errorMessage.includes("Could not delete all payment sessions") ||
        errorMessage.includes("delete.*payment.*session")) {
        // 这个错误通常不影响订单完成，Medusa 可能已经创建了订单
        // 尝试重新获取购物车状态，检查订单是否已创建
        console.warn("Payment session deletion warning (may not affect order completion):", errorMessage)
        // 继续抛出错误，让调用者决定如何处理
      }

      // 处理支付授权错误
      if (errorMessage.includes("not authorized") ||
        errorMessage.includes("Payment session") ||
        errorMessage.includes("payment.*authorized")) {
        throw new Error("Payment verification failed. Please ensure payment was completed successfully and try again.")
      }

      throw medusaError(error)
    })

  if (cartRes?.type === "order") {
    const orderCacheTag = await getCacheTag("orders")
    revalidateTag(orderCacheTag)

    removeCartId()

    // Return order info instead of redirecting
    // Client component will handle the redirect
    return {
      type: "order" as const,
      order: cartRes.order,
      redirectUrl: `/order/${cartRes.order.id}/confirmed`,
    }
  }

  return cartRes.cart
}
