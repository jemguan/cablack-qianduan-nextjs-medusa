"use client"

import { Text, Button } from "@medusajs/ui"
import { useEffect, useState, useMemo } from "react"
import { getOptionValuesByIds } from "@lib/data/option-values"
import { ChevronDownMini, ChevronUpMini } from "@medusajs/icons"
import { ChoiceImage } from "@modules/products/components/choice-image"

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

// 新格式：内嵌的选择信息（从 metadata 直接传递）
type EmbeddedChoice = {
  id: string
  title: string
  price_adjustment: number | string
  image_url?: string | null
  option_name: string
  template_title: string
}

type LineItemCustomOptionsProps = {
  item: {
    id: string
    metadata?: Record<string, any>
  }
  currencyCode?: string
  className?: string
  forceSingleColumn?: boolean
}

const LineItemCustomOptions = ({
  item,
  currencyCode = "USD",
  className = "",
  forceSingleColumn = false,
}: LineItemCustomOptionsProps) => {
  const [choices, setChoices] = useState<Choice[]>([])
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // 检测是否为移动端
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const metadata = item.metadata as Record<string, any> | undefined
    const customOptions = metadata?.custom_options

    if (!customOptions || !Array.isArray(customOptions)) {
      return
    }

    // 检查是否是新的内嵌格式（包含完整信息）
    const firstOption = customOptions[0]
    const isEmbeddedFormat =
      typeof firstOption === "object" &&
      firstOption !== null &&
      "price_adjustment" in firstOption &&
      "option_name" in firstOption

    if (isEmbeddedFormat) {
      // 新格式：直接使用内嵌的选择信息
      const embeddedChoices = customOptions as EmbeddedChoice[]

      // 转换为 Choice 格式以保持组件兼容性
      const transformedChoices: Choice[] = embeddedChoices.map((ec) => ({
        id: ec.id,
        title: ec.title,
        subtitle: null,
        hint_text: null,
        price_adjustment: ec.price_adjustment,
        image_url: ec.image_url || null,
        sort_order: 0,
        option: {
          id: ec.id,
          name: ec.option_name,
          template: {
            id: ec.id,
            title: ec.template_title,
          },
        },
      }))

      setChoices(transformedChoices)
      return
    }

    // 旧格式：只有选择 ID，需要通过 API 获取详情
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

  // 转换为数组以便处理
  const groupedChoicesArray = Array.from(groupedChoices.entries())

  // 手机端限制显示3个模板（无论是否 forceSingleColumn）
  const visibleTemplates = isMobile && !isExpanded
    ? groupedChoicesArray.slice(0, 3)
    : groupedChoicesArray

  // 移动端超过3个模板时显示展开按钮
  const hasMoreTemplates = isMobile && groupedChoicesArray.length > 3

  // 确定网格列数
  const gridCols = forceSingleColumn ? 'grid-cols-1' : (isMobile ? 'grid-cols-1' : 'grid-cols-2')

  return (
    <div className={`flex flex-col gap-2 mt-2 ${className}`}>
      {/* 一行显示2个模板（桌面端）或1个模板（移动端/强制单列） */}
      <div className={`grid gap-2 ${gridCols}`}>
        {visibleTemplates.map(([templateId, templateData]) => (
          <div key={templateId} className="flex flex-col gap-1.5 p-2 rounded border border-border/50 bg-muted/30">
            <Text className="text-xs font-medium text-muted-foreground">
              {templateData.templateTitle}:
            </Text>

            {/* 每个模板里的选择一行1个 */}
            <div className="flex flex-col gap-1">
              {Array.from(templateData.options.entries()).map(([optionId, optionData]) => (
                <div key={optionId} className="flex flex-col gap-0.5">
                  {/* 选项名称（如果有多个选项） */}
                  {templateData.options.size > 1 && optionData.optionName && (
                    <Text className="text-xs text-muted-foreground italic">
                      {optionData.optionName}:
                    </Text>
                  )}

                  {/* 选择列表 - 一行1个 */}
                  {optionData.choices.map((choice) => {
                    const priceText = formatPrice(choice.price_adjustment)
                    return (
                      <div
                        key={choice.id}
                        className="flex items-center gap-2 text-xs p-1.5 rounded bg-muted/50 border border-border/30"
                      >
                        {/* 选择图片 - 使用优化后的组件 */}
                        {choice.image_url && (
                          <ChoiceImage
                            imageUrl={choice.image_url}
                            alt={choice.title}
                            sizeClassName="w-8 h-8"
                            rounded={true}
                            showBorder={false}
                          />
                        )}

                        {/* 选择标题和价格 */}
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                          <Text className="text-xs text-foreground truncate leading-tight">
                            {choice.title}
                          </Text>
                          {priceText && (
                            <Text className="text-xs text-muted-foreground flex-shrink-0 font-medium">
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

      {/* 展开/收起按钮（仅移动端且超过3个模板时显示） */}
      {hasMoreTemplates && (
        <Button
          variant="transparent"
          size="small"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-xs flex items-center justify-center gap-1"
        >
          {isExpanded ? (
            <>
              <ChevronUpMini className="w-3 h-3" />
              <span>收起</span>
            </>
          ) : (
            <>
              <ChevronDownMini className="w-3 h-3" />
              <span>显示更多 ({groupedChoicesArray.length - 3})</span>
            </>
          )}
        </Button>
      )}
    </div>
  )
}

export default LineItemCustomOptions
