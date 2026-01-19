"use client"

import { useState, useEffect, useCallback } from "react"
import { listProducts } from "@lib/data/products"
import type { RestockItem } from "../types"

/**
 * 加载订阅产品的数据
 */
export function useProductData(subscriptions: RestockItem[]) {
  const [productData, setProductData] = useState<Record<string, any>>({})
  const [isFetchingProductData, setIsFetchingProductData] = useState(true)

  const loadProductData = useCallback(async () => {
    if (subscriptions.length === 0) {
      setIsFetchingProductData(false)
      return
    }

    setIsFetchingProductData(true)
    try {
      const uniqueProductIds = Array.from(
        new Set(subscriptions.map((s) => s.product_id))
      )

      if (uniqueProductIds.length > 0) {
        const { response } = await listProducts({
          queryParams: {
            id: uniqueProductIds,
            limit: uniqueProductIds.length,
            fields: "id,title,thumbnail,handle,*variants.title",
          },
        })

        const productMap: Record<string, any> = {}
        response.products?.forEach((product) => {
          productMap[product.id] = product
        })

        setProductData(productMap)
      }
    } catch (error) {
      console.error("Failed to load product data:", error)
    } finally {
      setIsFetchingProductData(false)
    }
  }, [subscriptions])

  useEffect(() => {
    loadProductData()
  }, [loadProductData])

  return {
    productData,
    isFetchingProductData,
    reloadProductData: loadProductData,
  }
}
