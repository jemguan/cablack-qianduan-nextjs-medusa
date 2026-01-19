"use client"

import { Bell } from "lucide-react"
import { Text } from "@medusajs/ui"

/**
 * 加载状态组件
 */
export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="inline-block animate-spin">
          <Bell className="text-ui-fg-muted" />
        </div>
        <Text className="mt-4 text-ui-fg-subtle">Loading...</Text>
      </div>
    </div>
  )
}
