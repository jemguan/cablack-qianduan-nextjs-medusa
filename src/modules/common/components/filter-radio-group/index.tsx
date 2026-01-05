"use client"

import { useState } from "react"
import { EllipseMiniSolid } from "@medusajs/icons"
import { Label, RadioGroup, Text, clx } from "@medusajs/ui"
import ChevronDown from "@modules/common/icons/chevron-down"
import ChevronUp from "@modules/common/icons/chevron-up"

type FilterRadioGroupProps = {
  title: string
  items: {
    value: string
    label: string
  }[]
  value: any
  handleChange: (...args: any[]) => void
  "data-testid"?: string
}

const FilterRadioGroup = ({
  title,
  items,
  value,
  handleChange,
  "data-testid": dataTestId,
}: FilterRadioGroupProps) => {
  const [isOpen, setIsOpen] = useState(false)

  // 获取当前选中项的标签
  const selectedLabel = items.find((i) => i.value === value)?.label || title

  return (
    <div className="flex gap-x-3 flex-col gap-y-3">
      {/* 手机端：可折叠的标题 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="small:hidden flex items-center justify-between w-full py-2 text-left"
        aria-expanded={isOpen}
        data-testid={`${dataTestId}-toggle`}
      >
        <Text className="txt-compact-small-plus text-ui-fg-muted">
          {title}: <span className="text-ui-fg-base">{selectedLabel}</span>
        </Text>
        {isOpen ? (
          <ChevronUp size={16} className="text-ui-fg-muted" />
        ) : (
          <ChevronDown size={16} className="text-ui-fg-muted" />
        )}
      </button>

      {/* 桌面端：普通标题 */}
      <Text className="hidden small:block txt-compact-small-plus text-ui-fg-muted">
        {title}
      </Text>

      {/* 选项列表 - 手机端可折叠，桌面端始终显示 */}
      <div
        className={clx({
          "hidden small:block": !isOpen, // 手机端：折叠时隐藏，桌面端始终显示
          "block": isOpen, // 手机端：展开时显示
        })}
      >
        <RadioGroup data-testid={dataTestId} onValueChange={handleChange}>
          {items?.map((i) => (
            <div
              key={i.value}
              className={clx("flex gap-x-2 items-center", {
                "ml-[-23px]": i.value === value,
              })}
            >
              {i.value === value && <EllipseMiniSolid />}
              <RadioGroup.Item
                checked={i.value === value}
                className="hidden peer"
                id={i.value}
                value={i.value}
              />
              <Label
                htmlFor={i.value}
                className={clx(
                  "!txt-compact-small !transform-none text-ui-fg-subtle hover:cursor-pointer",
                  {
                    "text-ui-fg-base": i.value === value,
                  }
                )}
                data-testid="radio-label"
                data-active={i.value === value}
                onClick={() => {
                  // 手机端选择后自动折叠（使用媒体查询检测）
                  const isMobile = window.matchMedia("(max-width: 1023px)").matches
                  if (isMobile) {
                    setIsOpen(false)
                  }
                }}
              >
                {i.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  )
}

export default FilterRadioGroup
