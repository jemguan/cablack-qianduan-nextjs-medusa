/**
 * BannerBlock Handler
 * 用于在产品页面展示 banner 图片
 */

import type { BlockBase, BlockConfig } from "./types"
import type { BannerBlockData } from "../../../home/components/banner-block/types"

/**
 * 安全解析整数
 */
function safeParseInt(value: any, defaultValue: number): number {
  if (value === undefined || value === null) {
    return defaultValue
  }
  if (typeof value === "number") {
    return value
  }
  const parsed = parseInt(String(value), 10)
  return isNaN(parsed) ? defaultValue : parsed
}

export function handleBannerBlock(
  block: BlockBase,
  blockConfig: Record<string, any>
): BlockConfig | null {
  // 如果禁用，返回 null
  if (blockConfig.enabled === false) {
    return null
  }

  // 构建 BannerBlockData
  const bannerBlockData: BannerBlockData = {
    modules: (blockConfig.modules || []).map((module: any) => {
      // 处理图片 URL，兼容旧的 object 格式
      let imageUrl = ""
      if (typeof module.image === "string") {
        imageUrl = module.image
      } else if (module.image?.desktop) {
        imageUrl = module.image.desktop
      }

      return {
        id: module.id || `module-${Date.now()}-${Math.random()}`,
        image: imageUrl,
        link: module.link,
        linkTarget: module.linkTarget || "_self",
        showOnDesktop: module.showOnDesktop !== false,
        showOnMobile: module.showOnMobile !== false,
        desktopCols: safeParseInt(module.desktopCols, 1),
        rowSpan: safeParseInt(module.rowSpan, 1),
      }
    }),
    gridCols: safeParseInt(blockConfig.gridCols, 1),
    gridGap: safeParseInt(blockConfig.gridGap, 24),
    mobileGridCols: safeParseInt(blockConfig.mobileGridCols, 1),
    fullWidth: blockConfig.fullWidth === true,
  }

  return {
    id: `banner-block-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: "BannerBlock",
    props: {
      data: bannerBlockData,
    },
  }
}
