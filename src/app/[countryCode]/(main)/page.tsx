import { Metadata } from "next"

import Hero from "@modules/home/components/hero"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { getMedusaConfig } from "@lib/admin-api/config"
import { getHomePageLayoutBlocks } from "@modules/home/utils/getPageLayoutBlocks"
import FeaturedCollections from "@modules/home/components/featured-collections"

export const metadata: Metadata = {
  title: "Medusa Next.js Starter Template",
  description:
    "A performant frontend ecommerce starter template with Next.js 15 and Medusa.",
}

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

  // 根据 pageLayouts 配置获取首页 blocks
  const pageBlocks = getHomePageLayoutBlocks(config, collections, region)

  // 组件映射
  const componentMap: Record<string, React.ComponentType<any>> = {
    FeaturedCollections,
    // 可以在这里添加更多组件映射
  }

  return (
    <>
      {/* Hero 组件（暂时保留，后续可以通过配置控制） */}
      <Hero />
      
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
          />
        )
      })}
    </>
  )
}
