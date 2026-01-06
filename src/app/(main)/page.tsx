import { Metadata } from "next"

import { listCategories } from "@lib/data/categories"
import { getCurrentRegion, getCountryCode } from "@lib/data/regions"
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
import { getPageTitle } from "@lib/data/page-title-config"
import type { HttpTypes } from "@medusajs/types"

export async function generateMetadata(): Promise<Metadata> {
  const title = await getPageTitle("home", { title: "Home" })
  return {
    title,
    description:
      "A performant frontend ecommerce starter template with Next.js 15 and Medusa.",
  }
}

// 首页缓存 5 分钟，确保 FeaturedBlog 等组件定期更新
export const revalidate = 300

export default async function Home() {
  // 并行获取基础数据：countryCode、region、categories、config、blogs
  const [countryCode, region, categories, config, blogResult] = await Promise.all([
    getCountryCode(),
    getCurrentRegion(),
    listCategories({ fields: "id, handle, name" }),
    getMedusaConfig(),
    listBlogs({ limit: "100", offset: "0" }).catch(() => ({ posts: [] })),
  ])

  if (!categories || !region) {
    return null
  }

  const blogArticles = blogResult.posts || []

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

  // 批量获取 CollageHero 需要的产品数据（一次请求获取所有产品）
  let collageHeroProducts: HttpTypes.StoreProduct[] = []
  if (collageHeroProductIds.length > 0) {
    try {
      const headers = await getAuthHeaders()
      const next = await getCacheOptions("products")
      const cacheConfig = getCacheConfig("PRODUCT_LIST")

      // 使用 id 数组参数一次性获取所有产品，而不是逐个请求
      const response = await sdk.client
        .fetch<{ products: HttpTypes.StoreProduct[] }>(
          `/store/products`,
          {
            method: "GET",
            query: {
              id: collageHeroProductIds, // 批量 ID 查询
              region_id: region.id,
              limit: collageHeroProductIds.length,
              fields:
                "*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*variants.inventory_items.inventory_item_id,*variants.inventory_items.required_quantity,*variants.images.id,*variants.images.url,*variants.images.metadata,+metadata,+tags,",
            },
            headers,
            next,
            ...cacheConfig,
          }
        )
        .catch(() => ({ products: [] }))

      collageHeroProducts = response.products || []
    } catch (error) {
      console.error('[Medusa HomePage] Error fetching CollageHero products:', error)
    }
  }

  // 根据 pageLayouts 配置获取首页 blocks
  const pageBlocks = await getHomePageLayoutBlocks(config, categories, region, collageHeroProducts, blogArticles)

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
