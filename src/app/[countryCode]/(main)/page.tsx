import { Metadata } from "next"

import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { getMedusaConfig } from "@lib/admin-api/config"
import { getPageLayoutBlocks } from "@lib/admin-api/pageLayoutUtils"
import { getHomePageLayoutBlocks } from "@modules/home/utils/getPageLayoutBlocks"
import FeaturedCollections from "@modules/home/components/featured-collections"
import { CollageHero } from "@modules/home/components/collage-hero"
import { BrandShowcase } from "@modules/home/components/brand-showcase"
import { TextBlock } from "@modules/home/components/text-block"
import { FAQBlock } from "@modules/home/components/faq-block"
import { FeaturedBlog } from "@modules/home/components/featured-blog"
import { FeaturedProduct } from "@modules/home/components/featured-product"
import { listBlogs } from "@lib/data/blogs"
import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheOptions } from "@lib/data/cookies"
import { getCacheConfig } from "@lib/config/cache"
import type { HttpTypes } from "@medusajs/types"

export const metadata: Metadata = {
  title: "Medusa Next.js Starter Template",
  description:
    "A performant frontend ecommerce starter template with Next.js 15 and Medusa.",
}

// 首页缓存 5 分钟，确保 FeaturedBlog 等组件定期更新
export const revalidate = 300

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!collections || !region) {
    return null
  }

  // 获取 Medusa 配置
  const config = await getMedusaConfig()

  // 提取 CollageHero blocks 中的产品 ID
  const collageHeroProductIds: string[] = []
  const blocks = getPageLayoutBlocks(config, 'home')
  
  for (const block of blocks) {
    if (block.type === 'collageHero' && block.enabled !== false) {
      const blockConfig = config?.blockConfigs?.['collageHero']?.[block.id] || block.config || {}
      const modules = blockConfig.modules || []
      
      for (const module of modules) {
        if (module.type === 'product' && module.productId) {
          collageHeroProductIds.push(module.productId)
        }
      }
    }
  }

  // 获取 CollageHero 需要的产品数据
  let collageHeroProducts: HttpTypes.StoreProduct[] = []
  if (collageHeroProductIds.length > 0) {
    try {
      const headers = await getAuthHeaders()
      const next = await getCacheOptions("products")
      const cacheConfig = getCacheConfig("PRODUCT_LIST")

      const productResponses = await Promise.all(
        collageHeroProductIds.map((productId) =>
          sdk.client
            .fetch<{ products: HttpTypes.StoreProduct[] }>(
              `/store/products`,
              {
                method: "GET",
                query: {
                  id: productId,
                  region_id: region.id,
                  fields:
                    "*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*variants.inventory_items.inventory_item_id,*variants.inventory_items.required_quantity,*variants.images.id,*variants.images.url,*variants.images.metadata,+metadata,+tags,",
                },
                headers,
                next,
                ...cacheConfig,
              }
            )
            .catch(() => ({ products: [] }))
        )
      )

      collageHeroProducts = productResponses
        .flatMap((response) => response.products || [])
        .filter((product, index, self) => 
          index === self.findIndex((p) => p.id === product.id)
        )
    } catch (error) {
      console.error('[Medusa HomePage] Error fetching CollageHero products:', error)
    }
  }

  // 获取博客数据（用于 FeaturedBlog blocks）
  let blogArticles: any[] = []
  try {
    const { posts } = await listBlogs({ limit: "100", offset: "0" })
    blogArticles = posts || []
  } catch (error) {
    console.error('[Medusa HomePage] Error fetching blogs:', error)
  }

  // 根据 pageLayouts 配置获取首页 blocks
  const pageBlocks = await getHomePageLayoutBlocks(config, collections, region, collageHeroProducts, blogArticles)

  // 组件映射
  const componentMap: Record<string, React.ComponentType<any>> = {
    FeaturedCollections,
    CollageHero,
    BrandShowcase,
    TextBlock,
    FAQBlock,
    FeaturedBlog,
    FeaturedProduct,
    // 可以在这里添加更多组件映射
  }

  return (
    <>
      {/* 根据配置动态渲染 blocks */}
      {pageBlocks.map((blockConfig) => {
        if (!blockConfig.enabled || !blockConfig.componentName) {
          return null
        }

        const Component = componentMap[blockConfig.componentName]
        if (!Component) {
          console.warn(`[Medusa HomePage] Unknown component: ${blockConfig.componentName}`)
          return null
        }

        return (
          <Component
            key={blockConfig.id}
            {...blockConfig.props}
            countryCode={countryCode}
          />
        )
      })}
    </>
  )
}
