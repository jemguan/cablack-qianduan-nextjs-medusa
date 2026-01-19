"use client"

import React, { useState, useCallback } from "react"
import { TooltipProvider } from "@medusajs/ui"
import type { Option, OptionTemplate } from "@lib/data/option-templates"
import { getComparisonGroupKey } from "./utils"
import { useMobileDetect, useSortedOptions, useComparisonGroups, getOptionComparisonGroupKey } from "./hooks"
import { OptionRow, ComparisonSwitcher } from "./components"

type OptionTemplateSelectProps = {
  template: OptionTemplate
  selectedChoiceIds: string[]
  onSelectionChange: (templateId: string, choiceIds: string[]) => void
  disabled?: boolean
}

const OptionTemplateSelect: React.FC<OptionTemplateSelectProps> = ({
  template,
  selectedChoiceIds,
  onSelectionChange,
  disabled = false,
}) => {
  const [comparisonSelections, setComparisonSelections] = useState<Record<string, string>>({})
  const isMobile = useMobileDetect()
  const sortedOptions = useSortedOptions(template)
  const comparisonGroups = useComparisonGroups(sortedOptions)

  // 处理选择变更
  const handleChoiceSelect = useCallback((option: Option, choiceId: string) => {
    if (disabled) return

    const isSelected = selectedChoiceIds.includes(choiceId)
    let newSelectedIds = [...selectedChoiceIds]

    if (option.selection_type === "single") {
      // 单选逻辑
      const optionChoiceIds = (option.choices || []).map((c) => c.id)
      newSelectedIds = newSelectedIds.filter((id) => !optionChoiceIds.includes(id))

      // 如果是对比选项，需要同时移除同组其他选项的已选择
      if (option.is_comparison && option.comparison_option_id) {
        const groupKey = getComparisonGroupKey(option.id, option.comparison_option_id)
        const groupOptions = comparisonGroups.get(groupKey) || []

        groupOptions.forEach((groupOption) => {
          if (groupOption.id !== option.id) {
            const groupOptionChoiceIds = (groupOption.choices || []).map((c) => c.id)
            newSelectedIds = newSelectedIds.filter((id) => !groupOptionChoiceIds.includes(id))
          }
        })
      }

      // 处理被其他对比选项引用的情况
      template.options?.forEach((otherOption) => {
        if (otherOption.id !== option.id && otherOption.is_comparison && otherOption.comparison_option_id === option.id) {
          const groupKey = getComparisonGroupKey(otherOption.id, option.id)
          const groupOptions = comparisonGroups.get(groupKey) || []

          groupOptions.forEach((groupOption) => {
            if (groupOption.id !== option.id) {
              const groupOptionChoiceIds = (groupOption.choices || []).map((c) => c.id)
              newSelectedIds = newSelectedIds.filter((id) => !groupOptionChoiceIds.includes(id))
            }
          })
        }
      })

      if (!isSelected) {
        newSelectedIds.push(choiceId)
      }
    } else {
      // 多选：切换选择状态
      if (isSelected) {
        newSelectedIds = newSelectedIds.filter((id) => id !== choiceId)
      } else {
        newSelectedIds.push(choiceId)
      }
    }

    onSelectionChange(template.id, newSelectedIds)
  }, [disabled, selectedChoiceIds, template, comparisonGroups, onSelectionChange])

  // 处理对比选项的切换
  const handleComparisonSwitch = useCallback((groupKey: string, selectedOptionId: string, groupOptions: Option[]) => {
    const oldSelectedOptionId = comparisonSelections[groupKey] || groupOptions[0]?.id
    const newSelectedOption = groupOptions.find((o) => o.id === selectedOptionId)

    let newSelectedIds = [...selectedChoiceIds]

    // 清除旧选项的选择
    if (oldSelectedOptionId) {
      const oldOption = groupOptions.find((o) => o.id === oldSelectedOptionId)
      if (oldOption) {
        const oldOptionChoiceIds = (oldOption.choices || []).map((c) => c.id)
        newSelectedIds = newSelectedIds.filter((id) => !oldOptionChoiceIds.includes(id))
      }
    }

    // 如果新选项中没有已选中的选择，自动选择默认值
    const newOptionSelectedChoiceIds = (newSelectedOption?.choices || [])
      .filter((c) => selectedChoiceIds.includes(c.id))
      .map((c) => c.id)

    if (newOptionSelectedChoiceIds.length === 0) {
      const defaultChoice = newSelectedOption?.choices?.find((c) => c.is_default)
      if (defaultChoice) {
        newSelectedIds.push(defaultChoice.id)
      }
    }

    setComparisonSelections((prev) => ({
      ...prev,
      [groupKey]: selectedOptionId,
    }))

    onSelectionChange(template.id, newSelectedIds)
  }, [comparisonSelections, selectedChoiceIds, template.id, onSelectionChange])

  // 渲染对比选项组
  const renderComparisonGroup = (groupKey: string, options: Option[]) => {
    const selectedOptionId = comparisonSelections[groupKey] || options[0]?.id
    const selectedOption = options.find((o) => o.id === selectedOptionId)

    if (!selectedOption) return null

    return (
      <div key={groupKey} className="flex flex-col gap-y-3">
        <ComparisonSwitcher
          options={options}
          selectedOptionId={selectedOptionId}
          onSwitch={(optionId) => handleComparisonSwitch(groupKey, optionId, options)}
        />
        <OptionRow
          option={selectedOption}
          selectedChoiceIds={selectedChoiceIds}
          isMobile={isMobile}
          disabled={disabled}
          onChoiceSelect={handleChoiceSelect}
        />
      </div>
    )
  }

  // 过滤出有 choices 的选项
  const optionsWithChoices = sortedOptions.filter(
    (option) => option.choices && option.choices.length > 0
  )

  if (!template.is_active || optionsWithChoices.length === 0) {
    return null
  }

  const renderedComparisonGroups = new Set<string>()

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-y-6">
        <div className="flex flex-col gap-y-6">
          {sortedOptions.map((option) => {
            const groupKey = getOptionComparisonGroupKey(option.id, comparisonGroups)

            if (groupKey) {
              if (renderedComparisonGroups.has(groupKey)) {
                return null
              }
              renderedComparisonGroups.add(groupKey)
              const groupOptions = comparisonGroups.get(groupKey) || []
              return renderComparisonGroup(groupKey, groupOptions)
            }

            return (
              <OptionRow
                key={option.id}
                option={option}
                selectedChoiceIds={selectedChoiceIds}
                isMobile={isMobile}
                disabled={disabled}
                onChoiceSelect={handleChoiceSelect}
              />
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}

export default OptionTemplateSelect
