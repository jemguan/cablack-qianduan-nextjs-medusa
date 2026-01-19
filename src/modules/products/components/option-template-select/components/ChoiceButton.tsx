"use client"

import { clx } from "@medusajs/ui"
import { Tooltip } from "@medusajs/ui"
import { ChoiceImage } from "@modules/products/components/choice-image"
import type { Choice } from "@lib/data/option-templates"
import { formatPriceAdjustment } from "../utils"

type ChoiceButtonProps = {
  choice: Choice
  isSelected: boolean
  isFirstVisible: boolean
  isMobile: boolean
  disabled: boolean
  onSelect: () => void
}

export function ChoiceButton({
  choice,
  isSelected,
  isFirstVisible,
  isMobile,
  disabled,
  onSelect,
}: ChoiceButtonProps) {
  const priceText = formatPriceAdjustment(choice.price_adjustment)

  const tooltipContent = (
    <div className="flex flex-col gap-1">
      <span className="font-medium">{choice.title}</span>
      {choice.hint_text && (
        <span className="text-xs text-ui-fg-muted">{choice.hint_text}</span>
      )}
    </div>
  )

  return (
    <Tooltip content={tooltipContent} sideOffset={8}>
      <button
        onClick={onSelect}
        disabled={disabled}
        className={clx(
          "flex flex-col items-center gap-1 transition-all duration-150 text-center flex-shrink-0",
          {
            "w-[calc(16.66%-6px)]": !isMobile,   // 桌面端：6个/行
            "w-[calc(33.333%-6px)]": isMobile,   // 移动端：3个/行
            "opacity-50 cursor-not-allowed": disabled,
          }
        )}
        data-testid={`choice-${choice.id}`}
      >
        <ChoiceImage
          imageUrl={choice.image_url}
          alt={choice.title}
          isSelected={isSelected}
          isFirstVisible={isFirstVisible}
          sizeClassName="w-full aspect-square mx-auto"
          borderColorSelected="border-orange-600 border-4"
        />

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
