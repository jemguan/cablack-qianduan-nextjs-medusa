"use client"

import { useState, useEffect, useCallback } from "react"
import type { Bundle } from "@lib/types/bundle"
import type { HttpTypes } from "@medusajs/types"
import { getBundlesByProductId } from "@lib/data/bundles"

/**
 * Bundle 数据及其完整产品信息
 */
export interface BundleWithProducts {
  bundle: Bundle
  /** 副产品完整数据列表 */
  addonProducts: HttpTypes.StoreProduct[]
  /** 产品ID到数量的映射 */
  quantityMap: Record<string, number>
}

/**
 * 获取 Bundle 及其完整产品数据的 Hook
 * 1. 获取包含当前产品作为主产品的 bundle
 * 2. 从 Onahole Station API 获取副产品的完整数据（包括价格、库存等）
 */
export function useBundleProducts(
  productId: string,
  regionId: string,
  countryCode?: string
) {
  const [bundlesWithProducts, setBundlesWithProducts] = useState<BundleWithProducts[]>([])
  const [loading, setLoading] = useState(true)

  const loadBundleProducts = useCallback(async () => {
    if (!productId || !regionId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // 1. 获取包含当前产品作为主产品的 bundles
      const bundles = await getBundlesByProductId(productId)

      if (bundles.length === 0) {
        setBundlesWithProducts([])
        setLoading(false)
        return
      }

      // 2. 收集所有副产品的 ID
      const allAddonProductIds = new Set<string>()
      const bundleQuantityMaps: Record<string, Record<string, number>> = {}

      bundles.forEach((bundle) => {
        bundleQuantityMaps[bundle.id] = {}
        
        bundle.addon_products?.forEach((item) => {
          const pid = item.product?.id
          if (pid) {
            allAddonProductIds.add(pid)
            bundleQuantityMaps[bundle.id][pid] = item.quantity || 1
          }
        })
      })

      if (allAddonProductIds.size === 0) {
        // 没有副产品，直接返回 bundle 信息
        setBundlesWithProducts(
          bundles.map((bundle) => ({
            bundle,
            addonProducts: [],
            quantityMap: {},
          }))
        )
        setLoading(false)
        return
      }

      // 3. 使用 Next.js API 代理路由获取产品数据，避免 CORS 问题
      const params = new URLSearchParams()
      Array.from(allAddonProductIds).forEach((id) => params.append('id', id))
      params.append('region_id', regionId)
      params.append('fields', '*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*variants.inventory_items.inventory_item_id,*variants.inventory_items.required_quantity,*variants.images.id,*variants.images.url,*variants.images.metadata,*variants.options.option_id,*variants.options.value,*options.id,*options.title,*options.values.id,*options.values.value,+metadata,+tags,')

      const fetchResponse = await fetch(`/api/medusa-proxy/products?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // 产品数据包含价格和库存，需要实时更新
      })

      if (!fetchResponse.ok) {
        throw new Error(`HTTP error: ${fetchResponse.status}`)
      }

      const response = await fetchResponse.json() as {
        products: HttpTypes.StoreProduct[]
        count: number
      }

      // 创建产品 ID 到产品对象的映射
      const productMap = new Map(
        (response.products || []).map((p) => [p.id, p])
      )

      // 4. 为每个 bundle 构建完整的数据
      const result: BundleWithProducts[] = bundles.map((bundle) => {
        // 获取该 bundle 的副产品
        const addonProducts: HttpTypes.StoreProduct[] = []
        const quantityMap = bundleQuantityMaps[bundle.id] || {}

        bundle.addon_products?.forEach((item) => {
          const pid = item.product?.id
          if (pid) {
            const fullProduct = productMap.get(pid)
            if (fullProduct) {
              addonProducts.push(fullProduct)
            }
          }
        })

        return {
          bundle,
          addonProducts,
          quantityMap,
        }
      })

      setBundlesWithProducts(result)
    } catch (error) {
      console.error("Failed to load bundle products:", error)
      setBundlesWithProducts([])
    } finally {
      setLoading(false)
    }
  }, [productId, regionId])

  useEffect(() => {
    loadBundleProducts()
  }, [loadBundleProducts])

  return {
    bundlesWithProducts,
    loading,
    refresh: loadBundleProducts,
  }
}

