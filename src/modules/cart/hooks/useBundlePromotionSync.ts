"use client"

import { useEffect, useRef, useMemo } from "react"
import { syncBundlePromotions } from "@lib/data/cart"
import type { HttpTypes } from "@medusajs/types"

/**
 * 购物车捆绑包折扣同步 Hook
 * 监听购物车变化，当捆绑包产品被移除时，自动移除对应的 Promotion
 */
export function useBundlePromotionSync(cart: HttpTypes.StoreCart | null) {
  const previousCartItemsRef = useRef<Map<string, Set<string>>>(new Map())
  const isSyncingRef = useRef(false)
  
  // 使用 useMemo 创建一个稳定的 items 指纹，避免因为引用变化而触发 effect
  // 只有当 items 的内容真正变化时才会更新
  const itemsFingerprint = useMemo(() => {
    if (!cart?.items) return ""
    // 创建一个基于 item ID 和 bundle_id 的指纹
    return cart.items
      .map((item) => `${item.id}:${item.metadata?.bundle_id || ""}`)
      .sort()
      .join("|")
  }, [cart?.items])

  useEffect(() => {
    if (!cart || !cart.items || !itemsFingerprint) {
      return
    }

    // 防止重复同步
    if (isSyncingRef.current) {
      return
    }

    const syncPromotions = async () => {
      try {
        // 构建当前购物车中每个 bundle_id 对应的产品 ID 集合
        const currentBundleProducts = new Map<string, Set<string>>()

        cart.items?.forEach((item) => {
          const bundleId = item.metadata?.bundle_id as string | undefined
          if (bundleId && item.product_id) {
            if (!currentBundleProducts.has(bundleId)) {
              currentBundleProducts.set(bundleId, new Set())
            }
            currentBundleProducts.get(bundleId)!.add(item.product_id)
          }
        })

        // 检查是否有捆绑包产品被移除
        const removedBundles: string[] = []

        previousCartItemsRef.current.forEach((productIds, bundleId) => {
          const currentProductIds = currentBundleProducts.get(bundleId)

          // 如果当前购物车中没有该捆绑包的产品，或者产品数量减少了
          if (!currentProductIds || currentProductIds.size < productIds.size) {
            // 检查是否还有该捆绑包的其他产品
            const remainingProducts = currentProductIds
              ? Array.from(currentProductIds)
              : []

            // 如果剩余产品数量为 0，需要移除 Promotion
            if (remainingProducts.length === 0) {
              removedBundles.push(bundleId)
            }
          }
        })

        // 移除已删除捆绑包的 Promotion
        if (removedBundles.length > 0) {
          isSyncingRef.current = true
          try {
            // 调用同步函数来更新 Promotion
            await syncBundlePromotions()
          } finally {
            isSyncingRef.current = false
          }
        }

        // 更新引用
        previousCartItemsRef.current = currentBundleProducts
      } catch (error) {
        console.error("Error syncing bundle promotions:", error)
        isSyncingRef.current = false
      }
    }

    syncPromotions()
  }, [cart, itemsFingerprint]) // 使用 fingerprint 而不是直接依赖 cart.items
}

