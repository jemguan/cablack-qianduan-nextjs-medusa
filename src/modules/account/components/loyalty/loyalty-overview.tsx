"use client"

import { LoyaltyAccount, LoyaltyConfig } from "@/types/loyalty"
import { FaStar } from "react-icons/fa"

interface LoyaltyOverviewProps {
  account: LoyaltyAccount
  config: LoyaltyConfig
}

export default function LoyaltyOverview({
  account,
  config,
}: LoyaltyOverviewProps) {
  const isVipActive =
    account.is_member &&
    account.membership_expires_at &&
    new Date(account.membership_expires_at) > new Date()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Points Balance Card */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Current Points</p>
            <p className="text-4xl font-bold text-primary mt-1">
              {account.points.toLocaleString()}
            </p>
          </div>
          {isVipActive && (
            <div className="bg-amber-500 text-white px-2 small:px-4 py-1.5 small:py-2 rounded-full text-xs small:text-sm font-medium flex items-center gap-1 small:gap-1.5 shadow-sm">
              <FaStar className="w-3 h-3 small:w-4 small:h-4" />
              <span className="hidden small:inline">VIP Member</span>
              <span className="small:hidden">VIP</span>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-primary/10">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Earned</p>
            <p className="text-lg font-semibold text-foreground">
              {account.total_earned.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Used</p>
            <p className="text-lg font-semibold text-foreground">
              {(account.total_earned - account.points).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* VIP Status */}
      {isVipActive && account.membership_expires_at && (
        <div className="bg-card border border-amber-200/50 dark:border-amber-800/50 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center shadow-sm">
              <FaStar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">
                VIP Member Benefits
              </p>
              <p className="text-sm text-muted-foreground">
                {config.vip_multiplier}x points multiplier · Valid until{" "}
                {formatDate(account.membership_expires_at)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Points Info */}
      <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm">
        <h4 className="font-semibold text-foreground mb-4">How Points Work</h4>
        <ul className="text-sm text-muted-foreground space-y-3">
          <li className="flex items-center gap-3">
            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
            <span className="text-foreground">Earn {config.points_earn_rate} points for every $1 spent</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
            <span className="text-foreground">Redeem {config.coupon_redemption_rate} points for $1 coupon</span>
          </li>
          {config.vip_multiplier > 1 && (
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></span>
              <span className="text-foreground">VIP members earn {config.vip_multiplier}x points</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
