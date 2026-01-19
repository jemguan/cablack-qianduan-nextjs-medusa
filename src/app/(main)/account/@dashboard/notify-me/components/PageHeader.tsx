"use client"

import { Heading, Text } from "@medusajs/ui"

interface PageHeaderProps {
  activeCount: number
  totalCount: number
  isRefreshing: boolean
  onRefresh: () => void
}

/**
 * 页面头部组件
 */
export function PageHeader({
  activeCount,
  totalCount,
  isRefreshing,
  onRefresh,
}: PageHeaderProps) {
  return (
    <div className="mb-6 small:mb-8">
      <div className="flex items-center justify-between mb-2 gap-2">
        <Heading level="h1" className="text-xl small:text-2xl font-bold">
          <span className="hidden small:inline">📬 My Restock Notifications</span>
          <span className="small:hidden">📬 Notifications</span>
        </Heading>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="px-3 small:px-4 py-2 text-xs small:text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 small:gap-2 flex-shrink-0"
        >
          {isRefreshing ? (
            <>
              <div className="w-3 h-3 small:w-4 small:h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              <span className="hidden small:inline">Refreshing...</span>
            </>
          ) : (
            <>
              🔄 <span className="hidden small:inline">Refresh</span>
            </>
          )}
        </button>
      </div>
      <Text className="text-ui-fg-subtle text-sm small:text-base hidden small:block">
        {totalCount === 0
          ? "You haven't subscribed to any restock notifications yet"
          : `You are watching ${activeCount} product(s) for restock`}
      </Text>
    </div>
  )
}
