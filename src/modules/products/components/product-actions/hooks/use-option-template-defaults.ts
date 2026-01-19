import { useEffect } from "react"
import type { OptionTemplate } from "@lib/data/option-templates"

type UseOptionTemplateDefaultsProps = {
  optionTemplates: OptionTemplate[]
  selectedChoicesByTemplate: Record<string, string[]>
  updateTemplateSelection: (templateId: string, choiceIds: string[]) => void
}

/**
 * 初始化选项模板的默认选择
 * 处理复杂的对比选项组逻辑
 */
export function useOptionTemplateDefaults({
  optionTemplates,
  selectedChoicesByTemplate,
  updateTemplateSelection,
}: UseOptionTemplateDefaultsProps) {
  useEffect(() => {
    if (!optionTemplates || optionTemplates.length === 0) return

    const defaultSelections: Record<string, string[]> = {}

    // 收集所有对比选项组（按模板分组）
    const comparisonGroupsByTemplate = new Map<string, Map<string, string[]>>()

    optionTemplates.forEach((template) => {
      if (!template.is_active || !template.options) return

      const templateGroups = new Map<string, string[]>()

      template.options.forEach((option) => {
        if (option.is_comparison && option.comparison_option_id) {
          const groupKey = [option.id, option.comparison_option_id].sort().join("-")
          if (!templateGroups.has(groupKey)) {
            templateGroups.set(groupKey, [])
          }
          const group = templateGroups.get(groupKey)!
          if (!group.includes(option.id)) {
            group.push(option.id)
          }
          // 也添加被引用的选项
          if (!group.includes(option.comparison_option_id)) {
            group.push(option.comparison_option_id)
          }
        }
      })

      if (templateGroups.size > 0) {
        comparisonGroupsByTemplate.set(template.id, templateGroups)
      }
    })

    optionTemplates.forEach((template) => {
      if (!template.is_active || !template.options) return

      const templateChoices: string[] = []

      // 按 sort_order 排序选项
      const sortedOptions = [...template.options].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

      // 获取当前模板的对比选项组
      const templateGroups = comparisonGroupsByTemplate.get(template.id)
      const processedComparisonGroups = new Set<string>()

      sortedOptions.forEach((option) => {
        if (!option.choices || option.choices.length === 0) return

        // 检查该选项是否属于对比选项组
        let groupKeyForOption: string | null = null
        if (templateGroups) {
          for (const [key, group] of Array.from(templateGroups.entries())) {
            if (group.includes(option.id)) {
              groupKeyForOption = key
              break
            }
          }
        }

        const isInComparisonGroup = groupKeyForOption !== null

        // 如果是对比选项组中的选项，只选择组内第一个选项的默认值
        if (isInComparisonGroup) {
          if (processedComparisonGroups.has(groupKeyForOption!)) {
            return
          }
          processedComparisonGroups.add(groupKeyForOption!)

          // 找到组内第一个选项（按 sort_order）
          const group = templateGroups!.get(groupKeyForOption!)!
          const groupOptions = sortedOptions.filter(o => group.includes(o.id))
          const firstOptionInGroup = groupOptions[0]

          // 只为组内第一个选项设置默认值
          if (firstOptionInGroup && firstOptionInGroup.id === option.id) {
            const defaultChoice = firstOptionInGroup.choices?.find((c) => c.is_default)
            if (defaultChoice) {
              templateChoices.push(defaultChoice.id)
            }
          }
        } else {
          // 非对比选项，正常处理默认选择
          const defaultChoice = option.choices.find((choice) => choice.is_default)
          if (defaultChoice) {
            templateChoices.push(defaultChoice.id)
          }
        }
      })

      if (templateChoices.length > 0) {
        defaultSelections[template.id] = templateChoices
      }
    })

    // 只在有默认选择且当前没有选择时设置
    if (Object.keys(defaultSelections).length > 0) {
      const hasExistingSelections = Object.values(selectedChoicesByTemplate).some(
        (choices) => choices.length > 0
      )
      if (!hasExistingSelections) {
        Object.entries(defaultSelections).forEach(([templateId, choices]) => {
          updateTemplateSelection(templateId, choices)
        })
      }
    }
  }, [optionTemplates, selectedChoicesByTemplate, updateTemplateSelection])
}
