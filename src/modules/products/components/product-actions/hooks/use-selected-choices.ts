import { useMemo } from "react"
import type { OptionTemplate } from "@lib/data/option-templates"

export type SelectedChoiceDetail = {
  id: string
  title: string
  price_adjustment: number | string
  image_url?: string | null
  option_name: string
  template_title: string
}

type UseSelectedChoicesProps = {
  optionTemplates: OptionTemplate[]
  selectedChoicesByTemplate: Record<string, string[]>
}

/**
 * 收集所有选中的选项信息（包含完整详情，用于添加到购物车）
 */
export function useSelectedChoices({
  optionTemplates,
  selectedChoicesByTemplate,
}: UseSelectedChoicesProps): SelectedChoiceDetail[] {
  return useMemo(() => {
    const allChoices: SelectedChoiceDetail[] = []

    if (!optionTemplates || optionTemplates.length === 0) {
      return allChoices
    }

    optionTemplates.forEach((template) => {
      if (!template.is_active || !template.options) return

      const selectedChoiceIds = selectedChoicesByTemplate[template.id] || []

      template.options.forEach((option) => {
        if (!option.choices || option.choices.length === 0) return

        option.choices.forEach((choice) => {
          const isSelected = selectedChoiceIds.includes(choice.id)

          if (isSelected) {
            allChoices.push({
              id: choice.id,
              title: choice.title,
              price_adjustment: choice.price_adjustment,
              image_url: choice.image_url || undefined,
              option_name: option.name,
              template_title: template.title,
            })
          }
        })
      })
    })

    return allChoices
  }, [optionTemplates, selectedChoicesByTemplate])
}
