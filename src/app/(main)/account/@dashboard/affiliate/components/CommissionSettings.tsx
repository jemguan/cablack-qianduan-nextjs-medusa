"use client"

interface CommissionSettingsProps {
  commissionRate: number
}

export function CommissionSettings({ commissionRate }: CommissionSettingsProps) {
  return (
    <div className="border border-border/50 rounded-xl p-6 bg-card shadow-sm">
      <h2 className="text-lg-semi mb-4 text-foreground">Commission Settings</h2>
      <p className="text-base-regular text-foreground">
        Your commission rate:{" "}
        <span className="font-semibold text-primary">{commissionRate}%</span>
      </p>
    </div>
  )
}
