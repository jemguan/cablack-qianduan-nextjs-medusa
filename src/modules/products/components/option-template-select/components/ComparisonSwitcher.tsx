"use client"

import { clx } from "@medusajs/ui"
import type { Option } from "@lib/data/option-templates"

type ComparisonSwitcherProps = {
  options: Option[]
  selectedOptionId: string
  onSwitch: (optionId: string) => void
}

export function ComparisonSwitcher({
  options,
  selectedOptionId,
  onSwitch,
}: ComparisonSwitcherProps) {
  // 过滤出有 choices 的有效选项
  const validOptions = options.filter((o) => o.choices && o.choices.length > 0)

  if (validOptions.length <= 1) {
    return null
  }

  return (
    <div className="flex items-center gap-2 p-1 bg-ui-bg-base rounded-lg border border-ui-border-base">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onSwitch(option.id)}
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
  )
}
