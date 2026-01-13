"use server"

import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"

// Choice 类型 - 对应后端的 template_choice
type Choice = {
  id: string
  title: string
  subtitle?: string | null
  hint_text?: string | null
  price_adjustment: number | string
  image_url?: string | null
  sort_order: number
  option?: {
    id: string
    name: string
    template?: {
      id: string
      title: string
    }
  }
}

/**
 * 批量获取选择详情（Choice）
 * 注意：后端 API 仍使用 option-values 路径，但实际返回的是 template_choice 数据
 */
export async function getOptionValuesByIds(
  choiceIds: string[]
): Promise<Choice[]> {
  if (!choiceIds || choiceIds.length === 0) {
    return []
  }

  try {
    const cacheOptions = await getCacheOptions("products")

    const response = await sdk.client.fetch<{
      option_values: Choice[]
    }>(
      `/store/option-values/batch`,
      {
        method: "POST",
        body: {
          option_ids: choiceIds,
        },
        next: cacheOptions,
      }
    )

    return response?.option_values || []
  } catch (error: any) {
    console.error(
      `Error fetching choices:`,
      error
    )
    return []
  }
}
