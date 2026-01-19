"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react"
import { HttpTypes } from "@medusajs/types"
import {
  LocalWishlist,
  LocalWishlistItem,
  Wishlist,
  WishlistItem,
} from "@lib/types/wishlist"
import {
  getOrCreateDefaultWishlist,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  batchAddToWishlist,
} from "@lib/data/wishlists"

const LOCAL_STORAGE_KEY = "guest_wishlist"

interface WishlistContextValue {
  // 状态
  isLoading: boolean
  isAuthenticated: boolean
  wishlistItems: WishlistItem[] | LocalWishlistItem[]
  itemCount: number
  wishlistId: string | null
  shareToken: string | null

  // 方法
  isInWishlist: (productId: string) => boolean
  toggleWishlist: (product: HttpTypes.StoreProduct) => Promise<void>
  addProduct: (product: HttpTypes.StoreProduct) => Promise<void>
  removeProduct: (productId: string) => Promise<void>
  refreshWishlist: () => Promise<void>
  syncLocalToServer: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

interface WishlistProviderProps {
  children: React.ReactNode
  customer: HttpTypes.StoreCustomer | null
}

export const WishlistProvider = ({
  children,
  customer,
}: WishlistProviderProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [wishlist, setWishlist] = useState<Wishlist | null>(null)
  const [localWishlist, setLocalWishlist] = useState<LocalWishlist | null>(null)

  const isAuthenticated = !!customer

  // 从 localStorage 加载游客心愿单
  const loadLocalWishlist = useCallback(() => {
    if (typeof window === "undefined") return null
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored) as LocalWishlist
      }
    } catch (error) {
      // Silently fail for local storage errors
    }
    return null
  }, [])

  // 保存游客心愿单到 localStorage
  const saveLocalWishlist = useCallback((wishlist: LocalWishlist) => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(wishlist))
    } catch (error) {
      // Silently fail for local storage errors
    }
  }, [])

  // 清除本地心愿单
  const clearLocalWishlist = useCallback(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
    } catch (error) {
      // Silently fail for local storage errors
    }
  }, [])

  // 从服务器加载心愿单
  const loadServerWishlist = useCallback(async () => {
    if (!isAuthenticated) return null
    try {
      const serverWishlist = await getOrCreateDefaultWishlist()
      if (serverWishlist) {
        // 获取完整的心愿单（包含 items）
        const fullWishlist = await getWishlist(serverWishlist.id)
        return fullWishlist
      }
    } catch (error) {
      // Silently fail for server wishlist errors
    }
    return null
  }, [isAuthenticated])

  // 同步本地心愿单到服务器
  // 使用批量 API 一次性添加所有本地项目，减少 API 调用次数
  const syncLocalToServer = useCallback(async () => {
    if (!isAuthenticated) return

    const local = loadLocalWishlist()
    if (!local || local.items.length === 0) return

    try {
      const serverWishlist = await getOrCreateDefaultWishlist()
      if (!serverWishlist) return

      // 准备批量添加的项目列表
      const itemsToAdd = local.items.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id ?? undefined,
        notes: item.notes ?? undefined,
      }))

      // 使用批量 API 一次性添加所有项目
      // 后端会自动跳过已存在的项目
      await batchAddToWishlist(serverWishlist.id, itemsToAdd)

      // 清除本地心愿单
      clearLocalWishlist()
      setLocalWishlist(null)

      // 重新加载服务器心愿单
      const updatedWishlist = await getWishlist(serverWishlist.id)
      setWishlist(updatedWishlist)
    } catch (error) {
      // Silently fail for sync errors
      console.warn("Failed to sync local wishlist to server:", error)
    }
  }, [isAuthenticated, loadLocalWishlist, clearLocalWishlist])

  // 刷新心愿单
  const refreshWishlist = useCallback(async () => {
    setIsLoading(true)
    try {
      if (isAuthenticated) {
        const serverWishlist = await loadServerWishlist()
        setWishlist(serverWishlist)
      } else {
        const local = loadLocalWishlist()
        setLocalWishlist(local)
      }
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, loadServerWishlist, loadLocalWishlist])

  // 初始化加载
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      try {
        if (isAuthenticated) {
          // 已登录：先同步本地数据，再加载服务器数据
          await syncLocalToServer()
          const serverWishlist = await loadServerWishlist()
          setWishlist(serverWishlist)
        } else {
          // 未登录：加载本地数据
          const local = loadLocalWishlist()
          setLocalWishlist(local)
        }
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [isAuthenticated, syncLocalToServer, loadServerWishlist, loadLocalWishlist])

  // 获取心愿单项目
  const wishlistItems = useMemo(() => {
    if (isAuthenticated && wishlist) {
      return wishlist.items || []
    }
    return localWishlist?.items || []
  }, [isAuthenticated, wishlist, localWishlist])

  // 获取心愿单项目数量
  const itemCount = useMemo(() => {
    return wishlistItems.length
  }, [wishlistItems])

  // 检查商品是否在心愿单中
  const isInWishlist = useCallback(
    (productId: string) => {
      return wishlistItems.some((item) => item.product_id === productId)
    },
    [wishlistItems]
  )

  // 添加商品到心愿单
  const addProduct = useCallback(
    async (product: HttpTypes.StoreProduct) => {
      if (isAuthenticated) {
        // 已登录：通过 API 添加
        try {
          const serverWishlist = await getOrCreateDefaultWishlist()
          if (!serverWishlist) throw new Error("Failed to get wishlist")

          await addToWishlist(serverWishlist.id, {
            product_id: product.id,
          })

          // 刷新心愿单
          const updatedWishlist = await getWishlist(serverWishlist.id)
          setWishlist(updatedWishlist)
        } catch (error) {
          throw error
        }
      } else {
        // 未登录：添加到本地存储
        const current = localWishlist || { items: [], updated_at: "" }
        const newItem: LocalWishlistItem = {
          product_id: product.id,
          added_at: new Date().toISOString(),
        }

        const updatedWishlist: LocalWishlist = {
          items: [...current.items, newItem],
          updated_at: new Date().toISOString(),
        }

        saveLocalWishlist(updatedWishlist)
        setLocalWishlist(updatedWishlist)
      }
    },
    [isAuthenticated, localWishlist, saveLocalWishlist]
  )

  // 从心愿单移除商品
  const removeProduct = useCallback(
    async (productId: string) => {
      if (isAuthenticated) {
        // 已登录：通过 API 移除
        try {
          if (!wishlist?.items) return

          const item = wishlist.items.find((i) => i.product_id === productId)
          if (!item) return

          await removeFromWishlist(wishlist.id, item.id)

          // 刷新心愿单
          const updatedWishlist = await getWishlist(wishlist.id)
          setWishlist(updatedWishlist)
        } catch (error) {
          throw error
        }
      } else {
        // 未登录：从本地存储移除
        if (!localWishlist) return

        const updatedWishlist: LocalWishlist = {
          items: localWishlist.items.filter(
            (item) => item.product_id !== productId
          ),
          updated_at: new Date().toISOString(),
        }

        saveLocalWishlist(updatedWishlist)
        setLocalWishlist(updatedWishlist)
      }
    },
    [isAuthenticated, wishlist, localWishlist, saveLocalWishlist]
  )

  // 切换心愿单状态
  const toggleWishlist = useCallback(
    async (product: HttpTypes.StoreProduct) => {
      if (isInWishlist(product.id)) {
        await removeProduct(product.id)
      } else {
        await addProduct(product)
      }
    },
    [isInWishlist, addProduct, removeProduct]
  )

  const value: WishlistContextValue = {
    isLoading,
    isAuthenticated,
    wishlistItems,
    itemCount,
    wishlistId: wishlist?.id || null,
    shareToken: wishlist?.share_token || null,
    isInWishlist,
    toggleWishlist,
    addProduct,
    removeProduct,
    refreshWishlist,
    syncLocalToServer,
  }

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (context === null) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}

/**
 * 可选的 hook - 如果没有 Provider 也不会报错
 * 用于在不确定是否有 Provider 的场景
 */
export const useWishlistOptional = () => {
  return useContext(WishlistContext)
}

