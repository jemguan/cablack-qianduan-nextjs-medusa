import type { Choice, Option } from "@lib/data/option-templates"

/**
 * 对选择项进行排序
 * 排序规则：sort_order -> created_at -> id
 */
export const sortChoices = (choices: Choice[]): Choice[] => {
  return [...choices].sort((a, b) => {
    const orderA = typeof a.sort_order === 'number' ? a.sort_order : (a.sort_order ? Number(a.sort_order) : 0)
    const orderB = typeof b.sort_order === 'number' ? b.sort_order : (b.sort_order ? Number(b.sort_order) : 0)

    if (orderA !== orderB) {
      return orderA - orderB
    }

    // 次要排序：按 created_at
    const aCreatedAt = (a as any).created_at
    const bCreatedAt = (b as any).created_at
    if (aCreatedAt && bCreatedAt) {
      const dateA = new Date(aCreatedAt).getTime()
      const dateB = new Date(bCreatedAt).getTime()
      if (dateA !== dateB) {
        return dateA - dateB
      }
    }

    // 最后使用 id 作为稳定排序键
    return (a.id || '').localeCompare(b.id || '')
  })
}

/**
 * 对选项进行排序（同时排序其 choices）
 */
export const sortOptions = (options: Option[]): Option[] => {
  return [...options]
    .map((option) => ({
      ...option,
      choices: sortChoices(option.choices || []),
    }))
    .sort((a, b) => {
      const orderA = typeof a.sort_order === 'number' ? a.sort_order : (a.sort_order ? Number(a.sort_order) : 0)
      const orderB = typeof b.sort_order === 'number' ? b.sort_order : (b.sort_order ? Number(b.sort_order) : 0)
      return orderA - orderB
    })
}

/**
 * 格式化价格增量显示（分转元）
 */
export const formatPriceAdjustment = (adjustment: number | string): string => {
  const num = typeof adjustment === "string" ? parseFloat(adjustment) : adjustment
  if (isNaN(num) || num === 0) {
    return ""
  }
  const formatted = num / 100
  const sign = formatted > 0 ? "+" : ""
  return `${sign}$${Math.abs(formatted).toFixed(2)}`
}

/**
 * 生成对比组的唯一 key
 */
export const getComparisonGroupKey = (optionId1: string, optionId2: string): string => {
  return [optionId1, optionId2].sort().join("-")
}
