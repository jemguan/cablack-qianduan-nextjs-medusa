/**
 * FAQ Block Handler (产品页)
 * 支持从产品 metadata 读取数据
 */

import type { HttpTypes } from "@medusajs/types"
import type { BlockBase, BlockConfig } from "./types"
import type { FAQData } from "../../../home/components/faq-block/types"
import { parseFAQMetadata } from "../../../home/components/faq-block/utils"

export function handleFAQBlock(
  block: BlockBase,
  blockConfig: Record<string, any>,
  product?: HttpTypes.StoreProduct
): BlockConfig | null {
  // 构建 FAQData
  let faqItems: any[] = []
  const dataMode = blockConfig.dataMode || "direct"

  // 如果是 metadata 模式，从产品 metadata 读取
  if (dataMode === "metadata" && product?.metadata) {
    const metafieldKey = blockConfig.metafieldConfig?.key || "faq"
    const metadataValue = product.metadata[metafieldKey] as string | undefined

    if (metadataValue) {
      // 如果 metadataValue 已经是对象，先转换为字符串
      const stringValue =
        typeof metadataValue === "string"
          ? metadataValue
          : JSON.stringify(metadataValue)

      faqItems = parseFAQMetadata(stringValue)

      // 调试日志
      if (faqItems.length === 0) {
        console.warn(
          `[FAQ Block] Failed to parse FAQ metadata for key "${metafieldKey}". Value:`,
          metadataValue
        )
      } else {
        console.log(
          `[FAQ Block] Successfully parsed ${faqItems.length} FAQ items from metadata key "${metafieldKey}"`
        )
      }
    } else {
      console.warn(
        `[FAQ Block] Metadata key "${metafieldKey}" not found in product metadata. Available keys:`,
        Object.keys(product.metadata || {})
      )
    }
  } else {
    // 直接配置模式
    faqItems = blockConfig.directItems || blockConfig.items || []
  }

  // 如果没有数据，返回 null（不渲染空的 FAQ block）
  if (faqItems.length === 0) {
    return null
  }

  const faqData: FAQData = {
    items: faqItems,
    defaultOpenFirst: blockConfig.defaultOpenFirst || false,
    allowMultiple: blockConfig.allowMultiple || false,
    theme: blockConfig.theme || "default",
    dataMode,
    metafieldConfig: blockConfig.metafieldConfig
      ? {
          key: blockConfig.metafieldConfig.key || "faq",
        }
      : undefined,
    directItems: faqItems,
    title: blockConfig.title || "",
    subtitle: blockConfig.subtitle || "",
    showTitle: blockConfig.showTitle !== false,
    showSubtitle: blockConfig.showSubtitle !== false,
    titleAlign: blockConfig.titleAlign || "left",
    showSearch: blockConfig.showSearch || false,
    searchPlaceholder: blockConfig.searchPlaceholder || "搜索问题...",
    iconType: blockConfig.iconType || "chevron",
    animationDuration: blockConfig.animationDuration || 300,
    enableAnimation: blockConfig.enableAnimation !== false,
  }

  return {
    id: `faq-block-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: "FAQBlock",
    props: {
      data: faqData,
    },
  }
}
