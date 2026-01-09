"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import {
  Wishlist,
  WishlistsResponse,
  WishlistResponse,
  CreateWishlistData,
  UpdateWishlistData,
  AddToWishlistData,
  WishlistItem,
} from "@lib/types/wishlist"
import { revalidateTag } from "next/cache"

const WISHLIST_CACHE_TAG = "wishlists"

/**
 * 获取当前用户的所有心愿单
 */
export async function getWishlists(params?: {
  limit?: number
  offset?: number
}): Promise<WishlistsResponse> {
  const { limit = 20, offset = 0 } = params || {}

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("wishlists")),
  }

  return await sdk.client
    .fetch<WishlistsResponse>(`/store/wishlists`, {
      method: "GET",
      query: {
        limit: limit.toString(),
        offset: offset.toString(),
      },
      headers,
      next,
    })
    .catch((err) => {
      // 如果用户未登录，返回空数组
      if (err?.status === 401) {
        return {
          wishlists: [],
          count: 0,
          limit,
          offset,
        }
      }
      return medusaError(err)
    })
}

/**
 * 获取单个心愿单详情
 */
export async function getWishlist(wishlistId: string): Promise<Wishlist | null> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("wishlists")),
  }

  return await sdk.client
    .fetch<{ wishlist: Wishlist }>(`/store/wishlists/${wishlistId}`, {
      method: "GET",
      headers,
      next,
    })
    .then(({ wishlist }) => wishlist)
    .catch(() => null)
}

/**
 * 通过分享令牌获取心愿单
 */
export async function getWishlistByToken(
  wishlistId: string,
  shareToken: string
): Promise<Wishlist | null> {
  const next = {
    ...(await getCacheOptions("wishlists")),
  }

  return await sdk.client
    .fetch<{ wishlist: Wishlist }>(`/store/wishlists/${wishlistId}`, {
      method: "GET",
      query: {
        share_token: shareToken,
      },
      next,
    })
    .then(({ wishlist }) => wishlist)
    .catch(() => null)
}

/**
 * 创建新心愿单
 */
export async function createWishlist(
  data: CreateWishlistData
): Promise<WishlistResponse> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const result = await sdk.client
    .fetch<WishlistResponse>(`/store/wishlists`, {
      method: "POST",
      body: data,
      headers,
    })
    .catch((err) => medusaError(err))

  revalidateTag(WISHLIST_CACHE_TAG)
  return result
}

/**
 * 更新心愿单
 */
export async function updateWishlist(
  wishlistId: string,
  data: UpdateWishlistData
): Promise<WishlistResponse> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const result = await sdk.client
    .fetch<WishlistResponse>(`/store/wishlists/${wishlistId}`, {
      method: "PUT",
      body: data,
      headers,
    })
    .catch((err) => medusaError(err))

  revalidateTag(WISHLIST_CACHE_TAG)
  return result
}

/**
 * 删除心愿单
 */
export async function deleteWishlist(wishlistId: string): Promise<void> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.client
    .fetch(`/store/wishlists/${wishlistId}`, {
      method: "DELETE",
      headers,
    })
    .catch((err) => medusaError(err))

  revalidateTag(WISHLIST_CACHE_TAG)
}

/**
 * 添加商品到心愿单
 */
export async function addToWishlist(
  wishlistId: string,
  data: AddToWishlistData
): Promise<{ item: WishlistItem }> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const result = await sdk.client
    .fetch<{ item: WishlistItem }>(`/store/wishlists/${wishlistId}/items`, {
      method: "POST",
      body: data,
      headers,
    })
    .catch((err) => medusaError(err))

  revalidateTag(WISHLIST_CACHE_TAG)
  return result
}

/**
 * 从心愿单移除商品
 */
export async function removeFromWishlist(
  wishlistId: string,
  itemId: string
): Promise<void> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.client
    .fetch(`/store/wishlists/${wishlistId}/items/${itemId}`, {
      method: "DELETE",
      headers,
    })
    .catch((err) => medusaError(err))

  revalidateTag(WISHLIST_CACHE_TAG)
}

/**
 * 获取或创建默认心愿单
 * 用于简化单心愿单模式的操作
 */
export async function getOrCreateDefaultWishlist(): Promise<Wishlist | null> {
  try {
    const { wishlists } = await getWishlists({ limit: 1 })
    
    if (wishlists.length > 0) {
      return wishlists[0]
    }

    // 创建默认心愿单
    const { wishlist } = await createWishlist({
      name: "My Wishlist",
      is_public: false,
    })

    return wishlist
  } catch (error) {
    return null
  }
}

/**
 * 快速添加商品到默认心愿单
 */
export async function quickAddToWishlist(
  productId: string,
  variantId?: string | null
): Promise<{ success: boolean; item?: WishlistItem; error?: string }> {
  try {
    const wishlist = await getOrCreateDefaultWishlist()
    
    if (!wishlist) {
      return { success: false, error: "Failed to get wishlist" }
    }

    const { item } = await addToWishlist(wishlist.id, {
      product_id: productId,
      variant_id: variantId,
    })

    return { success: true, item }
  } catch (error: any) {
    return { 
      success: false, 
      error: error?.message || "Failed to add to wishlist" 
    }
  }
}

/**
 * 从默认心愿单移除商品（通过 product_id 查找）
 */
export async function quickRemoveFromWishlist(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const wishlist = await getOrCreateDefaultWishlist()
    
    if (!wishlist) {
      return { success: false, error: "Failed to get wishlist" }
    }

    // 获取完整的心愿单以找到对应的 item
    const fullWishlist = await getWishlist(wishlist.id)
    if (!fullWishlist || !fullWishlist.items) {
      return { success: false, error: "Wishlist not found" }
    }

    const item = fullWishlist.items.find((i) => i.product_id === productId)
    if (!item) {
      return { success: false, error: "Item not found in wishlist" }
    }

    await removeFromWishlist(wishlist.id, item.id)
    return { success: true }
  } catch (error: any) {
    return { 
      success: false, 
      error: error?.message || "Failed to remove from wishlist" 
    }
  }
}

/**
 * 检查商品是否在心愿单中
 */
export async function isProductInWishlist(
  productId: string
): Promise<boolean> {
  try {
    const wishlist = await getOrCreateDefaultWishlist()
    
    if (!wishlist) {
      return false
    }

    const fullWishlist = await getWishlist(wishlist.id)
    if (!fullWishlist || !fullWishlist.items) {
      return false
    }

    return fullWishlist.items.some((i) => i.product_id === productId)
  } catch {
    return false
  }
}

/**
 * 批量添加商品到心愿单的项目数据
 */
export interface BatchAddItem {
  product_id: string
  variant_id?: string
  notes?: string
}

/**
 * 批量添加结果
 */
export interface BatchAddResult {
  added: string[]
  skipped: string[]
  errors: { product_id: string; error: string }[]
}

/**
 * 批量添加商品到心愿单
 * 用于登录时同步本地心愿单到服务器
 * 单次 API 调用替代多次单独调用，大幅减少网络请求
 */
export async function batchAddToWishlist(
  wishlistId: string,
  items: BatchAddItem[]
): Promise<{ success: boolean; result?: BatchAddResult; error?: string }> {
  if (!items || items.length === 0) {
    return { success: true, result: { added: [], skipped: [], errors: [] } }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    const response = await sdk.client
      .fetch<{ success: boolean; result: BatchAddResult; message: string }>(
        `/store/wishlists/batch-add`,
        {
          method: "POST",
          body: {
            wishlist_id: wishlistId,
            items,
          },
          headers,
        }
      )

    revalidateTag(WISHLIST_CACHE_TAG)
    return { success: true, result: response.result }
  } catch (error: any) {
    console.error("Failed to batch add to wishlist:", error)
    return {
      success: false,
      error: error?.message || "Failed to batch add to wishlist",
    }
  }
}

