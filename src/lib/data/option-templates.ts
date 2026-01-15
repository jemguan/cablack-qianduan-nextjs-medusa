"use server"

import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"

// 选择（Choice）- 最底层，用户实际选择的项目
type Choice = {
  id: string
  title: string
  subtitle?: string | null
  hint_text?: string | null
  price_adjustment: number | string
  image_url?: string | null
  sort_order: number
  is_default?: boolean
  created_at?: string | null
}

// 选项（Option）- 中间层，包含多个选择
type Option = {
  id: string
  name: string
  hint_text?: string | null
  selection_type: "single" | "multiple"
  is_required: boolean
  is_comparison: boolean
  comparison_option_id?: string | null
  sort_order: number
  choices?: Choice[]
}

// 模板（Template）- 顶层，包含多个选项
type OptionTemplate = {
  id: string
  title: string
  description?: string | null
  is_active: boolean
  sort_order?: number
  options?: Option[]
}

export type { Choice, Option, OptionTemplate }

/**
 * 获取产品关联的选项模板
 */
export async function getProductOptionTemplates(
  productId: string
): Promise<OptionTemplate[]> {
  if (!productId) {
    return []
  }

  try {
    const cacheOptions = await getCacheOptions("products")

    const response = await sdk.client.fetch<{
      option_templates: OptionTemplate[]
    }>(
      `/store/products/${encodeURIComponent(productId)}/option-templates`,
      {
        method: "GET",
        next: cacheOptions,
      }
    )

    return response?.option_templates || []
  } catch (error: any) {
    // 如果是 404 错误，静默处理（产品可能没有选项模板）
    if (error?.status === 404) {
      return []
    }
    // 其他错误记录日志但不抛出异常
    console.error(
      `Error fetching option templates for product ${productId}:`,
      error
    )
    return []
  }
}
