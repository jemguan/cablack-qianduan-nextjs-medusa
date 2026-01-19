import { useMemo } from "react"
import type { Option } from "@lib/data/option-templates"
import { sortOptions, getComparisonGroupKey } from "../utils"

export type ComparisonGroup = {
  groupKey: string
  options: Option[]
}

/**
 * 找出对比选项组（互斥的选项对）
 */
export function useComparisonGroups(sortedOptions: Option[]): Map<string, Option[]> {
  return useMemo(() => {
    const groups = new Map<string, Option[]>()

    sortedOptions.forEach((option) => {
      if (option.is_comparison && option.comparison_option_id) {
        const groupKey = getComparisonGroupKey(option.id, option.comparison_option_id)

        if (!groups.has(groupKey)) {
          groups.set(groupKey, [])
        }

        const group = groups.get(groupKey)!

        if (!group.find((o) => o.id === option.id)) {
          group.push(option)
        }

        // 添加对比的选项
        const comparedOption = sortedOptions.find((o) => o.id === option.comparison_option_id)
        if (comparedOption && !group.find((o) => o.id === comparedOption.id)) {
          group.push(comparedOption)
        }
      }
    })

    // 确保所有组内的选项按 sort_order 排序
    groups.forEach((options, groupKey) => {
      groups.set(groupKey, sortOptions(options))
    })

    return groups
  }, [sortedOptions])
}

/**
 * 获取选项所属的对比组 key
 */
export function getOptionComparisonGroupKey(
  optionId: string,
  comparisonGroups: Map<string, Option[]>
): string | null {
  for (const [groupKey, options] of Array.from(comparisonGroups.entries())) {
    if (options.find((o) => o.id === optionId)) {
      return groupKey
    }
  }
  return null
}
