"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import type { CollageModule } from "../types"
import type { HttpTypes } from "@medusajs/types"

interface UseLinkPrefetchProps {
  modules: CollageModule[]
  products?: HttpTypes.StoreProduct[]
}

/**
 * 链接预取 Hook
 * 预取所有模块中的链接，提升点击跳转速度
 */
export function useLinkPrefetch({
  modules,
  products,
}: UseLinkPrefetchProps): void {
  const router = useRouter()

  useEffect(() => {
    if (!modules || modules.length === 0) return

    const linksToPreFetch: string[] = []

    for (const module of modules) {
      if (module.type === "image" && module.link && !module.openInNewTab) {
        linksToPreFetch.push(module.link)
      } else if (module.type === "collection" && module.collectionHandle) {
        linksToPreFetch.push(`/collections/${module.collectionHandle}`)
      } else if (module.type === "text") {
        if (module.link && !module.openInNewTab) {
          linksToPreFetch.push(module.link)
        }
        if (module.buttonLink && !module.buttonOpenInNewTab) {
          linksToPreFetch.push(module.buttonLink)
        }
      } else if (module.type === "product" && module.productId) {
        // 产品链接会在产品详情中跳转
        const product = products?.find((p) => p.id === module.productId)
        if (product?.handle) {
          linksToPreFetch.push(`/products/${product.handle}`)
        }
      }
    }

    // 去重并预取
    const uniqueLinks = Array.from(new Set(linksToPreFetch))
    uniqueLinks.forEach((link) => {
      router.prefetch(link)
    })
  }, [modules, products, router])
}
