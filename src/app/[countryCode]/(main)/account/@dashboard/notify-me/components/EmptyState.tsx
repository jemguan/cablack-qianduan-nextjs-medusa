"use client"

import { Bell } from "lucide-react"
import Link from "next/link"
import { Button, Heading, Text } from "@medusajs/ui"

/**
 * 空状态组件
 */
export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 small:py-16 border border-dashed border-ui-border-base rounded-lg bg-ui-bg-subtle">
      <Bell size={40} className="text-ui-fg-muted mb-3 small:mb-4" />
      <Heading level="h2" className="text-base small:text-lg font-semibold mb-2">
        No Subscriptions
      </Heading>
      <Text className="text-ui-fg-subtle mb-4 small:mb-6 text-center max-w-md text-sm small:text-base px-4">
        <span className="hidden small:inline">
          When you see a "Notify Me" button on a product page, you can subscribe
          to restock notifications. We'll email you when the product is back in
          stock.
        </span>
        <span className="small:hidden">
          Click "Notify Me" on products to get restock alerts.
        </span>
      </Text>
      <Link href="/store">
        <Button variant="primary">Browse Products</Button>
      </Link>
    </div>
  )
}
