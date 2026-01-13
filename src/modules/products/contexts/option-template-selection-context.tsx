"use client"

import React, { createContext, useContext, useState, useCallback } from "react"

// 选项模板选择状态类型
type OptionTemplateSelectionState = {
  selectedChoicesByTemplate: Record<string, string[]>
  setSelectedChoicesByTemplate: (state: Record<string, string[]>) => void
  updateTemplateSelection: (templateId: string, choiceIds: string[]) => void
}

// 创建 Context
const OptionTemplateSelectionContext = createContext<OptionTemplateSelectionState | undefined>(undefined)

// Provider 组件
export function OptionTemplateSelectionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [selectedChoicesByTemplate, setSelectedChoicesByTemplate] = useState<
    Record<string, string[]>
  >({})

  const updateTemplateSelection = useCallback((templateId: string, choiceIds: string[]) => {
    setSelectedChoicesByTemplate((prev) => ({
      ...prev,
      [templateId]: choiceIds,
    }))
  }, [])

  return (
    <OptionTemplateSelectionContext.Provider
      value={{
        selectedChoicesByTemplate,
        setSelectedChoicesByTemplate,
        updateTemplateSelection,
      }}
    >
      {children}
    </OptionTemplateSelectionContext.Provider>
  )
}

// 自定义 Hook 用于使用 Context
export function useOptionTemplateSelection() {
  const context = useContext(OptionTemplateSelectionContext)
  if (!context) {
    throw new Error(
      "useOptionTemplateSelection must be used within an OptionTemplateSelectionProvider"
    )
  }
  return context
}

export type { OptionTemplateSelectionState }
