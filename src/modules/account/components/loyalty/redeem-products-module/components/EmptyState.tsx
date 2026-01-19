"use client"

interface EmptyStateProps {
  type: "products" | "rewards"
}

/**
 * 空状态组件
 */
export function EmptyState({ type }: EmptyStateProps) {
  if (type === "products") {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mx-auto mb-4 opacity-50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <p>No products available for redemption</p>
      </div>
    )
  }

  return (
    <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10 mx-auto mb-2 opacity-50"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
      <p>No redeemed product codes yet</p>
      <p className="text-xs mt-1">Product codes you redeem will appear here</p>
    </div>
  )
}
