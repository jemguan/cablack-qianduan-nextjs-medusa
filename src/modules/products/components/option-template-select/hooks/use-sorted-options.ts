import { useMemo } from "react"
import type { Option, OptionTemplate } from "@lib/data/option-templates"
import { sortOptions } from "../utils"

/**
 * 获取排序后的选项列表
 */
export function useSortedOptions(template: OptionTemplate): Option[] {
  return useMemo(() => {
    if (!template.options || template.options.length === 0) {
      return []
    }
    return sortOptions(template.options)
  }, [template.options])
}
