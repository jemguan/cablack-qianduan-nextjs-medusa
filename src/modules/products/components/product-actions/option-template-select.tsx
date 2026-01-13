"use client"

import { clx } from "@medusajs/ui"
import React, { useMemo, useState } from "react"
import Image from "next/image"
import { getImageUrl } from "@lib/util/image"
import type { Choice, Option, OptionTemplate } from "@lib/data/option-templates"

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
  // 追踪对比选项的当前选择（用于 is_comparison 功能）
  const [comparisonSelections, setComparisonSelections] = useState<Record<string, string>>({})

  // 获取排序后的选项
  const sortedOptions = useMemo(() => {
    if (!template.options || template.options.length === 0) {
      return []
    }
    return [...template.options].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  }, [template.options])

  // 找出对比选项组（互斥的选项对）
  const comparisonGroups = useMemo(() => {
    const groups = new Map<string, Option[]>()
    
    sortedOptions.forEach((option) => {
      if (option.is_comparison && option.comparison_option_id) {
        // 创建一个稳定的组 ID（两个选项 ID 排序后拼接）
        const groupKey = [option.id, option.comparison_option_id].sort().join("-")
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
    
    return groups
  }, [sortedOptions])

  // 获取选项是否属于某个对比组
  const getComparisonGroupKey = (optionId: string): string | null => {
    for (const [groupKey, options] of comparisonGroups.entries()) {
      if (options.find((o) => o.id === optionId)) {
        return groupKey
      }
    }
    return null
  }

  // 处理选择变更
  const handleChoiceSelect = (option: Option, choiceId: string) => {
    if (disabled) return

    const isSelected = selectedChoiceIds.includes(choiceId)
    let newSelectedIds = [...selectedChoiceIds]

    if (option.selection_type === "single") {
      // 单选：先移除该选项下的所有已选择，再添加新选择
      const optionChoiceIds = (option.choices || []).map((c) => c.id)
      newSelectedIds = newSelectedIds.filter((id) => !optionChoiceIds.includes(id))
      
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
  }

  // 处理对比选项的切换
  const handleComparisonSwitch = (groupKey: string, selectedOptionId: string) => {
    setComparisonSelections((prev) => ({
      ...prev,
      [groupKey]: selectedOptionId,
    }))
  }

  // 格式化价格增量显示（分转元）
  const formatPriceAdjustment = (adjustment: number | string): string => {
    const num = typeof adjustment === "string" ? parseFloat(adjustment) : adjustment
    if (isNaN(num) || num === 0) {
      return ""
    }
    const formatted = num / 100
    const sign = formatted > 0 ? "+" : ""
    return `${sign}$${Math.abs(formatted).toFixed(2)}`
  }

  // 渲染单个选择项
  const renderChoice = (choice: Choice, option: Option) => {
    const isSelected = selectedChoiceIds.includes(choice.id)
    const priceText = formatPriceAdjustment(choice.price_adjustment)
    const isSingleSelect = option.selection_type === "single"

    return (
      <button
        key={choice.id}
        onClick={() => handleChoiceSelect(option, choice.id)}
        disabled={disabled}
        className={clx(
          "flex items-start gap-3 p-3 rounded-lg border-2 transition-all duration-150 text-left w-full",
          {
            "border-ui-border-interactive bg-ui-bg-interactive": isSelected,
            "border-ui-border-base bg-ui-bg-subtle hover:border-ui-border-interactive/50 hover:shadow-elevation-card-rest":
              !isSelected && !disabled,
            "opacity-50 cursor-not-allowed": disabled,
          }
        )}
        data-testid={`choice-${choice.id}`}
      >
        {/* 选择指示器 */}
        <div className="flex-shrink-0 mt-0.5">
          {isSingleSelect ? (
            // 单选 - 圆形
            <div
              className={clx(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                {
                  "border-ui-fg-interactive": isSelected,
                  "border-ui-border-strong": !isSelected,
                }
              )}
            >
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-ui-fg-interactive" />
              )}
            </div>
          ) : (
            // 多选 - 方形
            <div
              className={clx(
                "w-4 h-4 rounded border-2 flex items-center justify-center",
                {
                  "border-ui-fg-interactive bg-ui-fg-interactive": isSelected,
                  "border-ui-border-strong": !isSelected,
                }
              )}
            >
              {isSelected && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6L5 9L10 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* 选择图片 */}
        {choice.image_url && (() => {
          const imageUrl = getImageUrl(choice.image_url)
          if (!imageUrl) return null
          return (
            <div className="relative w-14 h-14 flex-shrink-0 rounded overflow-hidden bg-ui-bg-base">
              <Image
                src={imageUrl}
                alt={choice.title}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
          )
        })()}

        {/* 选择内容 */}
        <div className="flex-1 flex flex-col gap-y-0.5 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <span
                className={clx("text-sm font-medium", {
                  "text-ui-fg-base": isSelected,
                  "text-ui-fg-subtle": !isSelected,
                })}
              >
                {choice.title}
              </span>
              {choice.subtitle && (
                <span className="text-xs text-ui-fg-muted">{choice.subtitle}</span>
              )}
            </div>
            {priceText && (
              <span
                className={clx("text-sm font-medium flex-shrink-0", {
                  "text-ui-fg-interactive": isSelected,
                  "text-ui-fg-muted": !isSelected,
                })}
              >
                {priceText}
              </span>
            )}
          </div>

          {/* 提示文字 */}
          {choice.hint_text && (
            <span className="text-xs text-ui-fg-muted">{choice.hint_text}</span>
          )}
        </div>
      </button>
    )
  }

  // 渲染单个选项
  const renderOption = (option: Option) => {
    const sortedChoices = [...(option.choices || [])].sort(
      (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
    )

    if (sortedChoices.length === 0) {
      return null
    }

    return (
      <div key={option.id} className="flex flex-col gap-y-3">
        {/* 选项标题 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ui-fg-base">{option.name}</span>
          {option.is_required && (
            <span className="text-xs text-ui-fg-error">*</span>
          )}
          {option.selection_type === "multiple" && (
            <span className="text-xs text-ui-fg-muted">(可多选)</span>
          )}
        </div>

        {/* 选项提示 */}
        {option.hint_text && (
          <span className="text-xs text-ui-fg-muted -mt-1">{option.hint_text}</span>
        )}

        {/* 选择列表 */}
        <div className="flex flex-col gap-y-2">
          {sortedChoices.map((choice) => renderChoice(choice, option))}
        </div>
      </div>
    )
  }

  // 渲染对比选项组
  const renderComparisonGroup = (groupKey: string, options: Option[]) => {
    const selectedOptionId = comparisonSelections[groupKey] || options[0]?.id
    const selectedOption = options.find((o) => o.id === selectedOptionId)

    if (!selectedOption) return null

    return (
      <div key={groupKey} className="flex flex-col gap-y-3">
        {/* 对比选项切换器 */}
        <div className="flex items-center gap-2 p-1 bg-ui-bg-base rounded-lg border border-ui-border-base">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleComparisonSwitch(groupKey, option.id)}
              className={clx(
                "flex-1 px-3 py-1.5 rounded text-sm font-medium transition-all",
                {
                  "bg-ui-bg-interactive text-ui-fg-on-color": selectedOptionId === option.id,
                  "text-ui-fg-subtle hover:text-ui-fg-base": selectedOptionId !== option.id,
                }
              )}
            >
              {option.name}
            </button>
          ))}
        </div>

        {/* 显示选中选项的选择 */}
        {renderOption(selectedOption)}
      </div>
    )
  }

  if (!template.is_active || sortedOptions.length === 0) {
    return null
  }

  // 分离普通选项和对比选项
  const renderedComparisonGroups = new Set<string>()
  
  return (
    <div className="flex flex-col gap-y-6">
      {/* 模板标题和描述 */}
      <div className="flex flex-col gap-y-1">
        <span className="text-base font-medium">{template.title}</span>
        {template.description && (
          <span className="text-sm text-ui-fg-subtle">{template.description}</span>
        )}
      </div>

      {/* 选项列表 */}
      <div className="flex flex-col gap-y-6">
        {sortedOptions.map((option) => {
          const groupKey = getComparisonGroupKey(option.id)
          
          if (groupKey) {
            // 对比选项组 - 只渲染一次
            if (renderedComparisonGroups.has(groupKey)) {
              return null
            }
            renderedComparisonGroups.add(groupKey)
            const groupOptions = comparisonGroups.get(groupKey) || []
            return renderComparisonGroup(groupKey, groupOptions)
          }
          
          // 普通选项
          return renderOption(option)
        })}
      </div>
    </div>
  )
}

export default OptionTemplateSelect
