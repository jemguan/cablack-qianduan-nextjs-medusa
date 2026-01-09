"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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

// 客户端缓存配置
const CACHE_TTL_MS = 60 * 1000 // 60秒缓存时间
const MAX_CACHE_SIZE = 50 // 最大缓存条目数

interface CacheEntry {
  data: HttpTypes.StoreProduct[]
  timestamp: number
}

// 简单的内存缓存，用于减少重复请求
const productCache = new Map<string, CacheEntry>()

/**
 * 获取缓存的产品数据
 */
function getCachedProducts(cacheKey: string): HttpTypes.StoreProduct[] | null {
  const entry = productCache.get(cacheKey)
  if (!entry) return null
  
  // 检查是否过期
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    productCache.delete(cacheKey)
    return null
  }
  
  return entry.data
}

/**
 * 设置缓存的产品数据
 */
function setCachedProducts(cacheKey: string, data: HttpTypes.StoreProduct[]): void {
  // 如果缓存过大，删除最旧的条目
  if (productCache.size >= MAX_CACHE_SIZE) {
    const firstKey = productCache.keys().next().value
    if (firstKey) {
      productCache.delete(firstKey)
    }
  }
  
  productCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  })
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
  
  // 用于跟踪组件是否已卸载
  const isMountedRef = useRef(true)
  // 用于取消 fetch 请求
  const abortControllerRef = useRef<AbortController | null>(null)

  const loadBundleProducts = useCallback(async () => {
    if (!productId || !regionId) {
      if (isMountedRef.current) {
        setLoading(false)
      }
      return
    }

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // 创建新的 AbortController
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    if (isMountedRef.current) {
      setLoading(true)
    }
    
    try {
      // 1. 获取包含当前产品作为主产品的 bundles
      const bundles = await getBundlesByProductId(productId)

      // 检查是否已取消或组件已卸载
      if (signal.aborted || !isMountedRef.current) {
        return
      }

      if (bundles.length === 0) {
        if (isMountedRef.current) {
          setBundlesWithProducts([])
          setLoading(false)
        }
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
        if (isMountedRef.current) {
          setBundlesWithProducts(
            bundles.map((bundle) => ({
              bundle,
              addonProducts: [],
              quantityMap: {},
            }))
          )
          setLoading(false)
        }
        return
      }

      // 3. 使用 Next.js API 代理路由获取产品数据，避免 CORS 问题
      const productIdsArray = Array.from(allAddonProductIds)
      
      // 创建缓存键（基于产品 ID 和区域）
      const cacheKey = `${productIdsArray.sort().join(',')}_${regionId}`
      
      // 检查缓存
      const cachedProducts = getCachedProducts(cacheKey)
      
      let products: HttpTypes.StoreProduct[]
      
      if (cachedProducts) {
        // 使用缓存的数据
        products = cachedProducts
      } else {
        // 缓存未命中，从 API 获取
        const params = new URLSearchParams()
        productIdsArray.forEach((id) => params.append('id', id))
        params.append('region_id', regionId)
        params.append('fields', '*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*variants.inventory_items.inventory_item_id,*variants.inventory_items.required_quantity,*variants.images.id,*variants.images.url,*variants.images.metadata,*variants.options.option_id,*variants.options.value,*options.id,*options.title,*options.values.id,*options.values.value,+metadata,+tags,')

        const fetchResponse = await fetch(`/api/medusa-proxy/products?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // 使用默认缓存策略，让浏览器和 CDN 可以缓存
          signal, // 添加 AbortController signal
        })

        // 检查是否已取消或组件已卸载
        if (signal.aborted || !isMountedRef.current) {
          return
        }

        if (!fetchResponse.ok) {
          throw new Error(`HTTP error: ${fetchResponse.status}`)
        }

        const response = await fetchResponse.json() as {
          products: HttpTypes.StoreProduct[]
          count: number
        }

        // 检查是否已取消或组件已卸载
        if (signal.aborted || !isMountedRef.current) {
          return
        }
        
        products = response.products || []
        
        // 存入缓存
        setCachedProducts(cacheKey, products)
      }

      // 创建产品 ID 到产品对象的映射
      const productMap = new Map(
        products.map((p) => [p.id, p])
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

      if (isMountedRef.current) {
        setBundlesWithProducts(result)
      }
    } catch (error) {
      // 忽略 AbortError（正常的取消操作）
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      console.error("Failed to load bundle products:", error)
      if (isMountedRef.current) {
        setBundlesWithProducts([])
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [productId, regionId])

  useEffect(() => {
    // 标记组件已挂载
    isMountedRef.current = true
    
    loadBundleProducts()
    
    // 清理函数：标记组件已卸载并取消任何进行中的请求
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [loadBundleProducts])

  return {
    bundlesWithProducts,
    loading,
    refresh: loadBundleProducts,
  }
}
