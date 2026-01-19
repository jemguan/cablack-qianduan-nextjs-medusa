"use client"

import { Text } from "@medusajs/ui"

/**
 * 帮助提示组件
 */
export function HelpTip() {
  return (
    <div className="mt-6 small:mt-8 p-3 small:p-4 bg-ui-bg-subtle border border-ui-border-base rounded-lg hidden small:block">
      <Text className="text-xs small:text-sm text-ui-fg-subtle">
        💡 <strong>Tip:</strong> When you purchase a subscribed product, the
        subscription is automatically marked as "Purchased". You can remove
        notifications from the list at any time.
      </Text>
    </div>
  )
}
