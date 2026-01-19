import { useMemo } from "react"
import type { OptionTemplate } from "@lib/data/option-templates"

type UseOptionValidationProps = {
  optionTemplates: OptionTemplate[]
  selectedChoicesByTemplate: Record<string, string[]>
}

type ValidationResult = {
  isValid: boolean
  missingOptions: string[]
}

/**
 * 验证必选选项是否已选择
 * 处理普通必选选项和对比选项组
 */
export function useOptionValidation({
  optionTemplates,
  selectedChoicesByTemplate,
}: UseOptionValidationProps): ValidationResult {
  return useMemo(() => {
    if (!optionTemplates || optionTemplates.length === 0) {
      return { isValid: true, missingOptions: [] }
    }

    const missing: string[] = []

    // 收集所有对比选项组（只处理一次）
    const comparisonGroups = new Map<string, {
      templateId: string
      templateName: string
      optionIds: string[]
      optionNames: string[]
    }>()

    optionTemplates.forEach((template) => {
      if (!template.is_active || !template.options) return

      template.options.forEach((option) => {
        // 处理对比选项组：收集所有相关的选项
        if (option.is_comparison && option.comparison_option_id) {
          const groupKey = [option.id, option.comparison_option_id].sort().join("-")
          if (!comparisonGroups.has(groupKey)) {
            comparisonGroups.set(groupKey, {
              templateId: template.id,
              templateName: template.title,
              optionIds: [],
              optionNames: [],
            })
          }
          const group = comparisonGroups.get(groupKey)!

          // 添加当前选项
          if (!group.optionIds.includes(option.id)) {
            group.optionIds.push(option.id)
            group.optionNames.push(option.name)
          }

          // 查找并添加对比的选项
          const comparedOption = template.options?.find((o) => o.id === option.comparison_option_id)
          if (comparedOption && !group.optionIds.includes(comparedOption.id)) {
            group.optionIds.push(comparedOption.id)
            group.optionNames.push(comparedOption.name)
          }
        }
      })
    })

    // 验证普通必选选项（排除对比选项组中的所有选项）
    optionTemplates.forEach((template) => {
      if (!template.is_active || !template.options) return

      const selectedChoices = selectedChoicesByTemplate[template.id] || []

      template.options.forEach((option) => {
        // 检查该选项是否属于对比选项组
        const isInComparisonGroup = Array.from(comparisonGroups.values()).some((group) =>
          group.optionIds.includes(option.id)
        )

        if (option.is_required && !isInComparisonGroup) {
          const hasSelection = (option.choices || []).some((choice) =>
            selectedChoices.includes(choice.id)
          )
          if (!hasSelection) {
            missing.push(option.name)
          }
        }
      })
    })

    // 验证对比选项组（组内任选一个即可）
    comparisonGroups.forEach((group) => {
      const selectedChoices = selectedChoicesByTemplate[group.templateId] || []

      // 检查组内是否有任何选项被选中
      const groupHasSelection = group.optionIds.some((optionId) => {
        const option = optionTemplates
          .find((t) => t.id === group.templateId)
          ?.options?.find((o) => o.id === optionId)
        return (option?.choices || []).some((choice) =>
          selectedChoices.includes(choice.id)
        )
      })

      if (!groupHasSelection) {
        const optionNames = group.optionNames.join(" / ")
        missing.push(`${optionNames} (Select one)`)
      }
    })

    return {
      isValid: missing.length === 0,
      missingOptions: missing,
    }
  }, [optionTemplates, selectedChoicesByTemplate])
}
