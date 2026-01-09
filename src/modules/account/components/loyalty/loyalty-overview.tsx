"use client"

import { LoyaltyAccount, LoyaltyConfig } from "@/types/loyalty"

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
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Points</p>
            <p className="text-4xl font-bold text-primary mt-1">
              {account.points.toLocaleString()}
            </p>
          </div>
          {isVipActive && (
            <div className="bg-amber-500 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  clipRule="evenodd"
                />
              </svg>
              VIP Member
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-primary/10">
          <div>
            <p className="text-xs text-muted-foreground">Total Earned</p>
            <p className="text-lg font-semibold">
              {account.total_earned.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Used</p>
            <p className="text-lg font-semibold">
              {(account.total_earned - account.points).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* VIP Status */}
      {isVipActive && account.membership_expires_at && (
        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-100">
                VIP Member Benefits
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {config.vip_multiplier}x points multiplier · Valid until{" "}
                {formatDate(account.membership_expires_at)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Points Info */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">How Points Work</h4>
        <ul className="text-sm text-muted-foreground space-y-1.5">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
            Earn {config.points_earn_rate} points for every $1 spent
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
            Redeem {config.coupon_redemption_rate} points for $1 coupon
          </li>
          {config.vip_multiplier > 1 && (
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              VIP members earn {config.vip_multiplier}x points
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
