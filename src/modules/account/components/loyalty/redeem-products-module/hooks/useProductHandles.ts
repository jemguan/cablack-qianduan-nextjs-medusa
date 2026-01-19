"use client"

import { useState, useEffect } from "react"
import { RewardRule } from "@/types/loyalty"
import { listProducts } from "@lib/data/products"

/**
 * 加载产品的 handles 用于生成产品链接
 */
export function useProductHandles(rules: RewardRule[]) {
  const [productHandles, setProductHandles] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadProductHandles = async () => {
      const productIds = rules
        .map((rule) => rule.product_id)
        .filter((id): id is string => id !== null)

      if (productIds.length === 0) return

      try {
        const { response } = await listProducts({
          queryParams: {
            id: productIds,
            limit: productIds.length,
            fields: "+handle",
          },
        })

        const handles: Record<string, string> = {}
        response.products?.forEach((product) => {
          if (product.id && product.handle) {
            handles[product.id] = product.handle
          }
        })
        setProductHandles(handles)
      } catch (error) {
        console.error("Failed to load product handles:", error)
      }
    }
    loadProductHandles()
  }, [rules])

  return productHandles
}
