"use client"

import { Text } from "@medusajs/ui"

type MissingOptionsAlertProps = {
  missingOptions: string[]
}

/**
 * 必选选项错误提示组件
 */
export function MissingOptionsAlert({ missingOptions }: MissingOptionsAlertProps) {
  if (missingOptions.length === 0) return null

  return (
    <div className="p-3 rounded-lg bg-ui-bg-subtle border border-ui-border-base">
      <Text className="text-ui-fg-error text-sm font-medium">
        Please select the following options:
      </Text>
      <ul className="mt-1 text-sm text-ui-fg-subtle list-disc list-inside">
        {missingOptions.map((option, index) => (
          <li key={index}>{option}</li>
        ))}
      </ul>
    </div>
  )
}
