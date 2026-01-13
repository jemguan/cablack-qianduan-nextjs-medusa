"use client"

import { Text } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { getOptionValuesByIds } from "@lib/data/option-values"
import { getImageUrl } from "@lib/util/image"
import Image from "next/image"

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

type LineItemCustomOptionsProps = {
  item: {
    id: string
    metadata?: Record<string, any>
  }
  currencyCode?: string
  className?: string
}

const LineItemCustomOptions = ({
  item,
  currencyCode = "USD",
  className = "",
}: LineItemCustomOptionsProps) => {
  const [choices, setChoices] = useState<Choice[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const metadata = item.metadata as Record<string, any> | undefined
    const customOptions = metadata?.custom_options

    if (!customOptions || !Array.isArray(customOptions)) {
      return
    }

    // 提取选择 ID
    const choiceIds = customOptions
      .map((opt: any) => {
        if (typeof opt === "string") {
          return opt
        }
        if (typeof opt === "object" && opt !== null) {
          return opt.id
        }
        return null
      })
      .filter((id: any) => id)

    if (choiceIds.length === 0) {
      return
    }

    // 获取选择详情
    setLoading(true)
    getOptionValuesByIds(choiceIds)
      .then((values) => {
        setChoices(values)
      })
      .catch((error) => {
        console.error("Error loading choices:", error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [item.id, item.metadata])

  if (loading || choices.length === 0) {
    return null
  }

  // 解析价格辅助函数
  const parsePrice = (value: any): number => {
    if (!value) return 0
    if (typeof value === "object") {
      if (value.raw !== undefined) return Number(value.raw)
      if (value.value !== undefined) return Number(value.value)
    }
    return Number(value) || 0
  }

  // 格式化价格显示（分转元）
  const formatPrice = (adjustment: number | string): string => {
    const cents = parsePrice(adjustment)
    if (cents === 0) {
      return ""
    }
    const dollars = cents / 100
    return dollars > 0 ? `+$${dollars.toFixed(2)}` : `$${dollars.toFixed(2)}`
  }

  // 按模板和选项分组
  // 结构: Map<templateId, Map<optionId, Choice[]>>
  const groupedChoices = new Map<string, { 
    templateTitle: string
    options: Map<string, { optionName: string; choices: Choice[] }>
  }>()

  choices.forEach((choice) => {
    const templateId = choice.option?.template?.id || "unknown"
    const templateTitle = choice.option?.template?.title || "Options"
    const optionId = choice.option?.id || "unknown"
    const optionName = choice.option?.name || ""

    if (!groupedChoices.has(templateId)) {
      groupedChoices.set(templateId, {
        templateTitle,
        options: new Map(),
      })
    }

    const templateGroup = groupedChoices.get(templateId)!
    if (!templateGroup.options.has(optionId)) {
      templateGroup.options.set(optionId, {
        optionName,
        choices: [],
      })
    }

    templateGroup.options.get(optionId)!.choices.push(choice)
  })

  return (
    <div className={`flex flex-col gap-2 mt-2 ${className}`}>
      {Array.from(groupedChoices.entries()).map(([templateId, templateData]) => (
        <div key={templateId} className="flex flex-col gap-1.5">
          <Text className="text-xs font-medium text-muted-foreground">
            {templateData.templateTitle}:
          </Text>
          <div className="flex flex-col gap-1 pl-2">
            {Array.from(templateData.options.entries()).map(([optionId, optionData]) => (
              <div key={optionId} className="flex flex-col gap-0.5">
                {/* 选项名称（如果有多个选项） */}
                {templateData.options.size > 1 && optionData.optionName && (
                  <Text className="text-xs text-muted-foreground italic">
                    {optionData.optionName}:
                  </Text>
                )}
                
                {/* 选择列表 */}
                {optionData.choices.map((choice) => {
                  const priceText = formatPrice(choice.price_adjustment)
                  return (
                    <div
                      key={choice.id}
                      className="flex items-center gap-2 text-xs pl-1"
                    >
                      {/* 选择图片 */}
                      {choice.image_url && (() => {
                        const imageUrl = getImageUrl(choice.image_url)
                        if (!imageUrl) return null
                        return (
                          <div className="relative w-6 h-6 flex-shrink-0 rounded overflow-hidden bg-ui-bg-base border border-border">
                            <Image
                              src={imageUrl}
                              alt={choice.title}
                              fill
                              className="object-cover"
                              sizes="24px"
                            />
                          </div>
                        )
                      })()}

                      {/* 选择标题和价格 */}
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <Text className="text-xs text-foreground truncate">
                          {choice.title}
                          {choice.subtitle && (
                            <span className="text-muted-foreground ml-1">
                              ({choice.subtitle})
                            </span>
                          )}
                        </Text>
                        {priceText && (
                          <Text className="text-xs text-muted-foreground flex-shrink-0">
                            {priceText}
                          </Text>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default LineItemCustomOptions
