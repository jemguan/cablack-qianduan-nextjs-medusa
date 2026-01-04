/**
 * Wishlist 相关类型定义
 */

import { HttpTypes } from "@medusajs/types"

export interface WishlistItem {
  id: string
  wishlist_id: string
  product_id: string
  variant_id?: string | null
  notes?: string | null
  sort_order: number
  created_at?: string
  updated_at?: string
  // 关联的产品信息（通过 API 扩展获取）
  product?: HttpTypes.StoreProduct
}

export interface Wishlist {
  id: string
  customer_id: string
  name: string
  is_public: boolean
  share_token?: string | null
  sort_order: number
  item_count: number
  created_at?: string
  updated_at?: string
  items?: WishlistItem[]
}

export interface WishlistsResponse {
  wishlists: Wishlist[]
  count: number
  limit: number
  offset: number
}

export interface WishlistResponse {
  wishlist: Wishlist
}

export interface CreateWishlistData {
  name: string
  is_public?: boolean
}

export interface UpdateWishlistData {
  name?: string
  is_public?: boolean
}

export interface AddToWishlistData {
  product_id: string
  variant_id?: string | null
  notes?: string | null
}

/**
 * 本地存储的心愿单项目（游客模式）
 */
export interface LocalWishlistItem {
  product_id: string
  variant_id?: string | null
  notes?: string | null
  added_at: string
}

/**
 * 本地存储的心愿单（游客模式）
 */
export interface LocalWishlist {
  items: LocalWishlistItem[]
  updated_at: string
}

