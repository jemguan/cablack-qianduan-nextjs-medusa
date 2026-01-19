"use client"

import { Button } from "@medusajs/ui"
import { Bell, BellOff } from "lucide-react"

type NotifyMeButtonProps = {
  onClick: () => void
  isLoading: boolean
  isSubscribed: boolean
}

/**
 * 补货通知按钮组件
 */
export function NotifyMeButton({
  onClick,
  isLoading,
  isSubscribed,
}: NotifyMeButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      variant="primary"
      className="flex-1 h-10 text-black dark:text-white border-none !border-2 !shadow-none bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 !border-blue-200 dark:!border-blue-800"
      style={{ borderColor: 'rgb(191 219 254)', borderWidth: '2px', borderStyle: 'solid' }}
      isLoading={isLoading}
      data-testid="notify-me-button"
    >
      <span className="flex items-center gap-1 sm:gap-2">
        <span className="hidden sm:inline">Out of Stock</span>
        <span className="inline sm:hidden">No Stock</span>
        <span className="text-gray-400 dark:text-gray-500">|</span>
        {isSubscribed ? <BellOff size={16} /> : <Bell size={16} />}
        {isSubscribed ? "Notified" : "Notify Me"}
      </span>
    </Button>
  )
}
