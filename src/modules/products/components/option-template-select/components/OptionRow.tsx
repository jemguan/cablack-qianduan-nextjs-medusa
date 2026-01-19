"use client"

import useEmblaCarousel from "embla-carousel-react"
import ChevronLeft from "@modules/common/icons/chevron-left"
import ChevronRight from "@modules/common/icons/chevron-right"
import type { Choice, Option } from "@lib/data/option-templates"
import { sortChoices } from "../utils"
import { ChoiceButton } from "./ChoiceButton"

type OptionRowProps = {
  option: Option
  selectedChoiceIds: string[]
  isMobile: boolean
  disabled: boolean
  onChoiceSelect: (option: Option, choiceId: string) => void
}

export function OptionRow({
  option,
  selectedChoiceIds,
  isMobile,
  disabled,
  onChoiceSelect,
}: OptionRowProps) {
  const sortedChoices = sortChoices(option.choices || [])

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    slidesToScroll: "auto",
    dragFree: true,
    containScroll: "trimSnaps",
  })

  if (sortedChoices.length === 0) {
    return null
  }

  const selectedChoices = sortedChoices.filter((choice) =>
    selectedChoiceIds.includes(choice.id)
  )

  const scrollPrev = () => emblaApi?.scrollPrev()
  const scrollNext = () => emblaApi?.scrollNext()

  return (
    <div className="flex flex-col gap-y-3">
      {/* 选项标题 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-ui-fg-base">{option.name}</span>
        {option.is_required && (
          <span className="text-xs text-ui-fg-error">*</span>
        )}
        {option.selection_type === "multiple" && (
          <span className="text-xs text-ui-fg-muted">(可多选)</span>
        )}
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
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-x-2">
            {sortedChoices.map((choice, index) => (
              <ChoiceButton
                key={choice.id}
                choice={choice}
                isSelected={selectedChoiceIds.includes(choice.id)}
                isFirstVisible={index === 0}
                isMobile={isMobile}
                disabled={disabled}
                onSelect={() => onChoiceSelect(option, choice.id)}
              />
            ))}
          </div>
        </div>

        {/* 导航按钮 - 只在桌面端显示 */}
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
