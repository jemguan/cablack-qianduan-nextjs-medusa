import { Metadata } from "next"
import dynamic from "next/dynamic"

import { listCategories } from "@lib/data/categories"
import { getCurrentRegion, getCountryCode } from "@lib/data/regions"
import { getMedusaConfig } from "@lib/admin-api/config"
import { getPageLayoutBlocks } from "@lib/admin-api/pageLayoutUtils"
import { getHomePageLayoutBlocks } from "@modules/home/utils/getPageLayoutBlocks"
import { listBlogs } from "@lib/data/blogs"
import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheOptions } from "@lib/data/cookies"
import { getCacheConfig } from "@lib/config/cache"
import { getPageTitle, getPageTitleConfig } from "@lib/data/page-title-config"
import type { HttpTypes } from "@medusajs/types"
import Schema from "@modules/common/components/seo/Schema"
import { getBaseURL } from "@lib/util/env"

// 首屏关键组件 - 正常导入
import { CollageHero } from "@modules/home/components/collage-hero"
import FeaturedCollections from "@modules/home/components/featured-collections"
import { TextBlock } from "@modules/home/components/text-block"
import { BannerBlock } from "@modules/home/components/banner-block"

// 非首屏组件 - 动态导入以减少初始 JS 包大小
const BrandShowcase = dynamic(
  () => import("@modules/home/components/brand-showcase").then(mod => mod.BrandShowcase),
  { 
    loading: () => <div className="min-h-[200px]" />,
    ssr: true  // 保持 SSR 以利于 SEO
  }
)

const FAQBlock = dynamic(
  () => import("@modules/home/components/faq-block").then(mod => mod.FAQBlock),
  { 
    loading: () => <div className="min-h-[300px]" />,
    ssr: true
  }
)

const FeaturedBlog = dynamic(
  () => import("@modules/home/components/featured-blog").then(mod => mod.FeaturedBlog),
  { 
    loading: () => <div className="min-h-[400px]" />,
    ssr: true
  }
)

const FeaturedProduct = dynamic(
  () => import("@modules/home/components/featured-product").then(mod => mod.FeaturedProduct),
  { 
    loading: () => <div className="min-h-[300px]" />,
    ssr: true
  }
)

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPageTitleConfig()

  const title = config.homepage_seo_title || await getPageTitle("home", { title: "Home" })
  const description = config.homepage_seo_description || "Shop the best products at Cablack. Your premium destination for ..."

  return {
    title,
    description: description,
    alternates: {
      canonical: getBaseURL(),
    },
    openGraph: {
      title,
      description,
      url: getBaseURL(),
      type: 'website',
    }
  }
}

// 首页缓存 5 分钟，确保 FeaturedBlog 等组件定期更新
export const revalidate = 300

export default async function Home() {
  // 并行获取基础数据：countryCode、region、categories、config、blogs、pageTitleConfig
  const [countryCode, region, categories, config, blogResult, pageTitleConfig] = await Promise.all([
    getCountryCode(),
    getCurrentRegion(),
    listCategories({ fields: "id, handle, name" }),
    getMedusaConfig(),
    listBlogs({ limit: "100", offset: "0" }).catch(() => ({ posts: [] })),
    getPageTitleConfig(),
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
    BannerBlock,
    FAQBlock,
    FeaturedBlog,
    FeaturedProduct,
    // 可以在这里添加更多组件映射
  }

  return (
    <>
      <Schema type="Organization" data={pageTitleConfig} />
      <Schema type="WebSite" data={pageTitleConfig} />

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
