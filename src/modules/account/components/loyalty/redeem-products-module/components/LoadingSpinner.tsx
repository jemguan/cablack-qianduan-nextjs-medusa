"use client"

/**
 * 加载中状态组件
 */
export function LoadingSpinner() {
  return (
    <div className="text-center py-6 text-muted-foreground">
      <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
      Loading...
    </div>
  )
}
