"use client"

import { useState } from "react"
import { Text, Button, clx } from "@medusajs/ui"
import type { HttpTypes } from "@medusajs/types"
import { createReview } from "@lib/data/reviews"
import RatingDisplay from "./RatingDisplay"

interface ReviewFormProps {
  product: HttpTypes.StoreProduct
  variantId?: string
  onSuccess?: () => void
  allowAnonymous?: boolean
}

/**
 * 评论表单组件
 */
export default function ReviewForm({
  product,
  variantId,
  onSuccess,
  allowAnonymous = true,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (rating === 0) {
      setError("Please select a rating")
      return
    }

    if (!content.trim()) {
      setError("Please enter your review content")
      return
    }

    if (allowAnonymous && !displayName.trim() && !email.trim()) {
      setError("Please enter your name or email")
      return
    }

    setIsSubmitting(true)

    try {
      await createReview({
        product_id: product.id,
        variant_id: variantId,
        rating,
        title: title.trim() || undefined,
        content: content.trim(),
        display_name: displayName.trim() || undefined,
        email: email.trim() || undefined,
        verified_purchase: false, // TODO: Check if customer has purchased
      })

      setSuccess(true)
      setRating(0)
      setTitle("")
      setContent("")
      setDisplayName("")
      setEmail("")
      onSuccess?.()

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err: any) {
      setError(err.message || "Failed to submit review. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-md">
        <Text className="text-sm text-green-700">
          Thank you for your review! It will be published after moderation.
        </Text>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 错误提示 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <Text className="text-sm text-red-700">{error}</Text>
        </div>
      )}

      {/* 评分选择 */}
      <div>
        <Text className="text-sm font-semibold mb-2 block">Rating *</Text>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none"
            >
              <svg
                className={clx(
                  "w-6 h-6 transition-colors",
                  star <= (hoveredRating || rating)
                    ? "text-yellow-400 fill-current"
                    : "text-ui-border-base"
                )}
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-ui-fg-subtle">
              {rating} {rating === 1 ? "star" : "stars"}
            </span>
          )}
        </div>
      </div>

      {/* 标题 */}
      <div>
        <label htmlFor="review-title" className="text-sm font-semibold mb-2 block">
          Title (optional)
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-ui-border-base rounded-md focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive"
          placeholder="Give your review a title"
        />
      </div>

      {/* 内容 */}
      <div>
        <label htmlFor="review-content" className="text-sm font-semibold mb-2 block">
          Review *</label>
        <textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 border border-ui-border-base rounded-md focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive"
          placeholder="Share your experience with this product"
          required
        />
      </div>

      {/* 匿名评论字段 */}
      {allowAnonymous && (
        <>
          <div>
            <label htmlFor="review-name" className="text-sm font-semibold mb-2 block">
              Your Name (optional)
            </label>
            <input
              id="review-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-ui-border-base rounded-md focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="review-email" className="text-sm font-semibold mb-2 block">
              Your Email (optional)
            </label>
            <input
              id="review-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-ui-border-base rounded-md focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive"
              placeholder="your.email@example.com"
            />
          </div>
        </>
      )}

      {/* 提交按钮 */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>

      <Text className="text-xs text-ui-fg-subtle">
        Your review will be published after moderation.
      </Text>
    </form>
  )
}

