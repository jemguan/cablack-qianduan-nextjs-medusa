"use client"

import type { AffiliateStats } from "../types"
import { formatCurrency } from "../utils"

interface StatsOverviewProps {
  stats: AffiliateStats
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="border border-border/50 rounded-xl p-6 bg-card shadow-sm">
      <h2 className="text-lg-semi mb-6 text-foreground">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 small:gap-6">
        <div>
          <p className="text-sm text-muted-foreground mb-2 font-medium">Total Orders</p>
          <p className="text-2xl font-semibold text-foreground">{stats.total_orders}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2 font-medium">Pending Amount</p>
          <p className="text-2xl font-semibold text-foreground">
            {formatCurrency(stats.pending_amount + stats.approved_amount)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2 font-medium">Paid Amount</p>
          <p className="text-2xl font-semibold text-green-600 dark:text-green-500">
            {formatCurrency(stats.paid_amount)}
          </p>
        </div>
      </div>
    </div>
  )
}
