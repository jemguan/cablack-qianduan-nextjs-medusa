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
  // 已订阅时显示绿色，未订阅时显示蓝色
  const buttonClassName = isSubscribed
    ? "flex-1 h-10 text-black dark:text-white border-none !border-2 !shadow-none bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 !border-green-200 dark:!border-green-800"
    : "flex-1 h-10 text-black dark:text-white border-none !border-2 !shadow-none bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 !border-blue-200 dark:!border-blue-800"

  const borderColor = isSubscribed ? "rgb(187 247 208)" : "rgb(191 219 254)"

  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      variant="primary"
      className={buttonClassName}
      style={{ borderColor, borderWidth: '2px', borderStyle: 'solid' }}
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
