"use client"

import { useState } from "react"
import { Text, clx } from "@medusajs/ui"
import type { Review } from "./types"
import RatingDisplay from "./RatingDisplay"
import { voteReview } from "@lib/data/reviews"
import Image from "next/image"
import { getImageUrl } from "@lib/util/image"

interface ReviewItemProps {
  review: Review
  onVoteUpdate?: () => void
}

/**
 * 单个评论项组件
 */
export default function ReviewItem({ review, onVoteUpdate }: ReviewItemProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count || 0)
  const [hasVoted, setHasVoted] = useState(false)

  const handleVote = async (isHelpful: boolean) => {
    if (isVoting || hasVoted) return

    setIsVoting(true)
    try {
      await voteReview(review.id, isHelpful)
      setHelpfulCount((prev) => prev + 1)
      setHasVoted(true)
      onVoteUpdate?.()
    } catch (error) {
      console.error("Failed to vote review:", error)
    } finally {
      setIsVoting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const displayName =
    review.display_name ||
    review.email?.split("@")[0] ||
    review.customer_id?.slice(0, 8) ||
    "Anonymous"

  return (
    <div className="border-b border-ui-border-base py-4 last:border-b-0">
      {/* 评论头部 */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Text className="font-semibold text-sm">{displayName}</Text>
            {review.verified_purchase && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                Verified Purchase
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <RatingDisplay rating={review.rating} size="sm" />
            <Text className="text-xs text-ui-fg-subtle">
              {formatDate(review.created_at)}
            </Text>
          </div>
        </div>
      </div>

      {/* 评论标题 */}
      {review.title && (
        <Text className="font-semibold text-sm mb-1">{review.title}</Text>
      )}

      {/* 评论内容 */}
      <Text className="text-sm text-ui-fg-base mb-3 whitespace-pre-wrap">
        {review.content}
      </Text>

      {/* 评论图片 */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {review.images.map((imageUrl, index) => {
            const fullImageUrl = getImageUrl(imageUrl)
            if (!fullImageUrl) return null

            return (
              <div
                key={index}
                className="relative w-20 h-20 rounded-md overflow-hidden border border-ui-border-base"
              >
                <Image
                  src={fullImageUrl}
                  alt={`Review image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            )
          })}
        </div>
      )}

      {/* 管理员回复 */}
      {review.responses && review.responses.length > 0 && (
        <div className="mt-3 pl-4 border-l-2 border-ui-border-base">
          {review.responses.map((response) => (
            <div key={response.id} className="mb-2">
              <Text className="text-xs font-semibold text-ui-fg-subtle mb-1">
                Store Response
              </Text>
              <Text className="text-sm text-ui-fg-base">{response.content}</Text>
            </div>
          ))}
        </div>
      )}

      {/* 投票按钮 */}
      <div className="flex items-center gap-4 mt-3">
        <button
          onClick={() => handleVote(true)}
          disabled={isVoting || hasVoted}
          className={clx(
            "text-xs text-ui-fg-subtle hover:text-ui-fg-base transition-colors",
            hasVoted && "text-ui-fg-interactive",
            (isVoting || hasVoted) && "cursor-not-allowed opacity-50"
          )}
        >
          Helpful ({helpfulCount})
        </button>
      </div>
    </div>
  )
}

