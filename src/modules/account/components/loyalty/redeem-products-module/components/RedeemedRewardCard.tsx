"use client"

import Image from "next/image"
import { FaCopy } from "react-icons/fa"
import type { RedeemedRewardCardProps } from "../types"

/**
 * 已兑换奖励卡片组件
 */
export function RedeemedRewardCard({
  reward,
  onCopyCode,
}: RedeemedRewardCardProps) {
  return (
    <div className="flex flex-col small:flex-row items-start small:items-center gap-3 small:gap-4 p-3 small:p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-colors">
      {/* Product Image */}
      <div className="w-full small:w-14 h-32 small:h-14 bg-muted rounded-lg overflow-hidden flex-shrink-0">
        {reward.product_thumbnail ? (
          <Image
            src={reward.product_thumbnail}
            alt={reward.product_title}
            width={56}
            height={56}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
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
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 w-full small:w-auto">
        <div className="flex items-center gap-2 small:gap-3 flex-wrap mb-1">
          <span className="font-mono font-bold text-sm small:text-base text-primary select-all break-all">
            {reward.code}
          </span>
        </div>
        <p className="text-xs small:text-sm text-muted-foreground line-clamp-2 small:truncate mb-2 small:mb-0">
          {reward.product_title}
        </p>
        <div className="flex items-center gap-2 small:gap-3 text-xs text-muted-foreground flex-wrap">
          <span>{reward.points_used.toLocaleString()} pts used</span>
          <span>·</span>
          <span>
            {new Date(reward.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
          </span>
        </div>
      </div>

      <button
        onClick={() => onCopyCode(reward.code)}
        className="w-full small:w-auto px-3 py-2 small:py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors flex items-center justify-center gap-1 min-h-[44px] small:min-h-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label={`Copy code ${reward.code}`}
      >
        <FaCopy className="h-4 w-4" />
        Copy
      </button>
    </div>
  )
}
