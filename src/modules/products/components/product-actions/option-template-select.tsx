"use client"

import { clx } from "@medusajs/ui"
import React, { useMemo, useState, useEffect, useCallback } from "react"
import { Tooltip, TooltipProvider } from "@medusajs/ui"
import useEmblaCarousel from "embla-carousel-react"
import ChevronLeft from "@modules/common/icons/chevron-left"
import ChevronRight from "@modules/common/icons/chevron-right"
import { ChoiceImage } from "@modules/products/components/choice-image"
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
  
  // 检测是否为移动端（小于640px）
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 获取排序后的选项（确保每个选项的choices也排序）
  const sortedOptions = useMemo(() => {
    if (!template.options || template.options.length === 0) {
      return []
    }
    return [...template.options]
      .map((option) => {
        // 确保每个选项的choices都按sort_order排序
        const sortedChoices = [...(option.choices || [])].sort((a, b) => {
          const orderA = typeof a.sort_order === 'number' ? a.sort_order : (a.sort_order ? Number(a.sort_order) : 0)
          const orderB = typeof b.sort_order === 'number' ? b.sort_order : (b.sort_order ? Number(b.sort_order) : 0)
          
          // 如果 sort_order 相同，使用 created_at 作为次要排序键
          if (orderA !== orderB) {
            return orderA - orderB
          }
          
          // 次要排序：按 created_at（如果存在）
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
        return {
          ...option,
          choices: sortedChoices,
        }
      })
      .sort((a, b) => {
        const orderA = typeof a.sort_order === 'number' ? a.sort_order : (a.sort_order ? Number(a.sort_order) : 0)
        const orderB = typeof b.sort_order === 'number' ? b.sort_order : (b.sort_order ? Number(b.sort_order) : 0)
        return orderA - orderB
      })
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
    
    // 确保所有组内的选项按 sort_order 排序，并且每个选项的choices也排序
    groups.forEach((options, groupKey) => {
      const sortedGroupOptions = [...options]
        .map((option) => {
          // 确保choices已排序（sortedOptions中已经排序了，但为了安全再次排序）
          const sortedChoices = [...(option.choices || [])].sort((a, b) => {
            const orderA = typeof a.sort_order === 'number' ? a.sort_order : (a.sort_order ? Number(a.sort_order) : 0)
            const orderB = typeof b.sort_order === 'number' ? b.sort_order : (b.sort_order ? Number(b.sort_order) : 0)
            
            // 如果 sort_order 相同，使用 created_at 作为次要排序键
            if (orderA !== orderB) {
              return orderA - orderB
            }
            
            // 次要排序：按 created_at（如果存在）
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
          return {
            ...option,
            choices: sortedChoices,
          }
        })
        .sort((a, b) => {
          const orderA = typeof a.sort_order === 'number' ? a.sort_order : (a.sort_order ? Number(a.sort_order) : 0)
          const orderB = typeof b.sort_order === 'number' ? b.sort_order : (b.sort_order ? Number(b.sort_order) : 0)
          return orderA - orderB
        })
      groups.set(groupKey, sortedGroupOptions)
    })
    
    return groups
  }, [sortedOptions])

  // 获取选项是否属于某个对比组
  const getComparisonGroupKey = (optionId: string): string | null => {
    for (const [groupKey, options] of Array.from(comparisonGroups.entries())) {
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
      // 单选逻辑
      const optionChoiceIds = (option.choices || []).map((c) => c.id)

      // 先移除该选项下的所有已选择
      newSelectedIds = newSelectedIds.filter((id) => !optionChoiceIds.includes(id))

      // 如果是对比选项，需要同时移除同组其他选项的已选择
      if (option.is_comparison && option.comparison_option_id) {
        const groupKey = [option.id, option.comparison_option_id].sort().join("-")
        const groupOptions = comparisonGroups.get(groupKey) || []

        // 移除同组所有选项的已选择
        groupOptions.forEach((groupOption) => {
          if (groupOption.id !== option.id) {
            const groupOptionChoiceIds = (groupOption.choices || []).map((c) => c.id)
            newSelectedIds = newSelectedIds.filter((id) => !groupOptionChoiceIds.includes(id))
          }
        })
      }

      // 另外：如果当前选项是被其他对比选项引用的选项，也需要清除引用它的选项的选择
      // 这样当用户直接在"不可动眼"中选择时，也能清除"可动眼"的选择
      template.options?.forEach((otherOption) => {
        if (otherOption.id !== option.id && otherOption.is_comparison && otherOption.comparison_option_id === option.id) {
          const groupKey = [otherOption.id, option.id].sort().join("-")
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
  }

  // 处理对比选项的切换
  const handleComparisonSwitch = (groupKey: string, selectedOptionId: string, groupOptions: Option[]) => {
    const oldSelectedOptionId = comparisonSelections[groupKey] || groupOptions[0]?.id
    const newSelectedOption = groupOptions.find((o) => o.id === selectedOptionId)

    // 清除旧选项的选择
    let newSelectedIds = [...selectedChoiceIds]
    if (oldSelectedOptionId) {
      const oldOption = groupOptions.find((o) => o.id === oldSelectedOptionId)
      if (oldOption) {
        const oldOptionChoiceIds = (oldOption.choices || []).map((c) => c.id)
        newSelectedIds = newSelectedIds.filter((id) => !oldOptionChoiceIds.includes(id))
      }
    }

    // 检查新选项中是否已经有选中的选择
    const newOptionSelectedChoiceIds = (newSelectedOption?.choices || [])
      .filter((c) => selectedChoiceIds.includes(c.id))
      .map((c) => c.id)

    // 如果新选项中没有已选中的选择，自动选择第一个有 is_default 的选择
    if (newOptionSelectedChoiceIds.length === 0) {
      const defaultChoice = newSelectedOption?.choices?.find((c) => c.is_default)
      if (defaultChoice) {
        newSelectedIds.push(defaultChoice.id)
      }
    }

    // 更新本地状态
    setComparisonSelections((prev) => ({
      ...prev,
      [groupKey]: selectedOptionId,
    }))

    // 通知父组件
    onSelectionChange(template.id, newSelectedIds)
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
  const renderChoice = (choice: Choice, option: Option, index: number) => {
    const isSelected = selectedChoiceIds.includes(choice.id)
    const priceText = formatPriceAdjustment(choice.price_adjustment)

    // 构建 tooltip 内容
    const tooltipContent = (
      <div className="flex flex-col gap-1">
        <span className="font-medium">{choice.title}</span>
        {choice.hint_text && (
          <span className="text-xs text-ui-fg-muted">{choice.hint_text}</span>
        )}
      </div>
    )

    // 判断是否是首个可见项（用于优先加载）
    const isFirstVisible = index === 0

    return (
      <Tooltip key={choice.id} content={tooltipContent} sideOffset={8}>
        <button
          onClick={() => handleChoiceSelect(option, choice.id)}
          disabled={disabled}
          className={clx(
            "flex flex-col items-center gap-1 transition-all duration-150 text-center flex-shrink-0",
            {
              "w-[calc(16.66%-6px)]": !isMobile,   // 桌面端：6个/行
              "w-[calc(33.333%-6px)]": isMobile, // 移动端：3个/行
              "opacity-50 cursor-not-allowed": disabled,
            }
          )}
          data-testid={`choice-${choice.id}`}
        >
          {/* 选择图片 - 使用优化后的组件 */}
          <ChoiceImage
            imageUrl={choice.image_url}
            alt={choice.title}
            isSelected={isSelected}
            isFirstVisible={isFirstVisible}
            sizeClassName="w-full aspect-square mx-auto"
            borderColorSelected="border-orange-600 border-4"
          />

          {/* 价格 */}
          {priceText && (
            <span
              className={clx("text-xs font-medium truncate w-full", {
                "text-ui-fg-interactive": isSelected,
                "text-ui-fg-muted": !isSelected,
              })}
            >
              {priceText}
            </span>
          )}
        </button>
      </Tooltip>
    )
  }

  // 渲染单个选项
  const renderOption = (option: Option) => {
    // 确保 choices 按 sort_order 排序（防御性排序，确保始终正确）
    const sortedChoices = [...(option.choices || [])].sort((a, b) => {
      const orderA = typeof a.sort_order === 'number' ? a.sort_order : (a.sort_order ? Number(a.sort_order) : 0)
      const orderB = typeof b.sort_order === 'number' ? b.sort_order : (b.sort_order ? Number(b.sort_order) : 0)
      
      // 如果 sort_order 相同，使用 created_at 作为次要排序键
      if (orderA !== orderB) {
        return orderA - orderB
      }
      
      // 次要排序：按 created_at（如果存在）
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

    if (sortedChoices.length === 0) {
      return null
    }

    // 获取当前选项中被选中的选择
    const selectedChoices = sortedChoices.filter((choice) =>
      selectedChoiceIds.includes(choice.id)
    )

    // 轮播配置 - 移动端和桌面端都不循环
    const [emblaRef, emblaApi] = useEmblaCarousel({
      loop: false,
      align: "start",
      slidesToScroll: "auto",
      dragFree: true,
      containScroll: "trimSnaps",
    })

    const scrollPrev = () => {
      if (emblaApi) emblaApi.scrollPrev()
    }

    const scrollNext = () => {
      if (emblaApi) emblaApi.scrollNext()
    }

    return (
      <div key={option.id} className="flex flex-col gap-y-3">
        {/* 选项标题 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-ui-fg-base">{option.name}</span>
          {option.is_required && (
            <span className="text-xs text-ui-fg-error">*</span>
          )}
          {option.selection_type === "multiple" && (
            <span className="text-xs text-ui-fg-muted">(可多选)</span>
          )}
          {/* 显示选中的选择标题 */}
          {selectedChoices.length > 0 && (
            <span className="text-sm text-ui-fg-interactive">
              {option.selection_type === "multiple"
                ? `(${selectedChoices.length}个已选)`
                : `: ${selectedChoices[0]?.title}`}
            </span>
          )}
        </div>

        {/* 选择列表轮播 */}
        <div className="relative">
          {/* 轮播容器 */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-x-2">
              {sortedChoices.map((choice, index) => renderChoice(choice, option, index))}
            </div>
          </div>

          {/* 导航按钮 - 只在桌面端显示（移动端不显示箭头） */}
          {!isMobile && sortedChoices.length > 6 && (
            <>
              <button
                onClick={scrollPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-ui-bg-base border border-ui-border-base shadow-md hover:bg-ui-bg-subtle z-10 -translate-x-1/2"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={scrollNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-ui-bg-base border border-ui-border-base shadow-md hover:bg-ui-bg-subtle z-10 translate-x-1/2"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* 选项提示 */}
        {option.hint_text && (
          <span className="text-xs text-ui-fg-muted">{option.hint_text}</span>
        )}
      </div>
    )
  }

  // 渲染对比选项组
  const renderComparisonGroup = (groupKey: string, options: Option[]) => {
    const selectedOptionId = comparisonSelections[groupKey] || options[0]?.id
    const selectedOption = options.find((o) => o.id === selectedOptionId)

    if (!selectedOption) return null

    // 过滤出有 choices 的有效选项
    const validOptions = options.filter((o) => o.choices && o.choices.length > 0)
    const showSwitcher = validOptions.length > 1

    return (
      <div key={groupKey} className="flex flex-col gap-y-3">
        {/* 对比选项切换器 - 只有多个有效选项时才显示 */}
        {showSwitcher && (
          <div className="flex items-center gap-2 p-1 bg-ui-bg-base rounded-lg border border-ui-border-base">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleComparisonSwitch(groupKey, option.id, options)}
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
        )}

        {/* 显示选中选项的选择 */}
        {renderOption(selectedOption)}
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

  // 分离普通选项和对比选项
  const renderedComparisonGroups = new Set<string>()
  
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-y-6">
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
    </TooltipProvider>
  )
}

export default OptionTemplateSelect
