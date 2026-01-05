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
  const [hideName, setHideName] = useState(false)
  const [hideEmail, setHideEmail] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // 隐藏邮箱中间部分的辅助函数
  const maskEmail = (email: string): string => {
    if (!email || !email.includes("@")) return email
    
    const [localPart, domain] = email.split("@")
    if (localPart.length <= 2) {
      return `${localPart[0]}***@${domain}`
    }
    
    const visibleStart = localPart.substring(0, Math.max(1, Math.floor(localPart.length / 3)))
    const visibleEnd = localPart.substring(localPart.length - Math.max(1, Math.floor(localPart.length / 3)))
    const masked = visibleStart + "***" + visibleEnd
    
    return `${masked}@${domain}`
  }

  // 隐藏名字中间部分的辅助函数
  const maskName = (name: string): string => {
    if (!name || name.length <= 2) {
      return name.length === 1 ? `${name}***` : `${name[0]}***${name[name.length - 1]}`
    }
    
    const visibleStart = name.substring(0, Math.max(1, Math.floor(name.length / 3)))
    const visibleEnd = name.substring(name.length - Math.max(1, Math.floor(name.length / 3)))
    return visibleStart + "***" + visibleEnd
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (rating === 0) {
      setError("Please select a rating")
      return
    }

    if (!title.trim()) {
      setError("Please enter a review title")
      return
    }

    if (!content.trim()) {
      setError("Please enter your review content")
      return
    }

    // 验证：至少需要填写名字或邮箱其中一个
    if (allowAnonymous && !displayName.trim() && !email.trim()) {
      setError("Please enter your name or email (at least one is required)")
      return
    }
    
    // 如果隐藏了名字，必须填写邮箱
    if (allowAnonymous && hideName && !email.trim()) {
      setError("Please enter your email when hiding your name")
      return
    }
    
    // 如果隐藏了邮箱，必须填写名字
    if (allowAnonymous && hideEmail && !displayName.trim()) {
      setError("Please enter your name when hiding your email")
      return
    }
    
    // 如果填写了邮箱，验证邮箱格式
    if (email.trim() && !hideEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        setError("Please enter a valid email address")
        return
      }
    }
    
    // 如果隐藏了邮箱但填写了邮箱，也需要验证格式
    if (hideEmail && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        setError("Please enter a valid email address")
        return
      }
    }

    setIsSubmitting(true)

    try {
      await createReview({
        product_id: product.id,
        variant_id: variantId,
        rating,
        title: title.trim(),
        content: content.trim(),
        display_name: hideName ? (displayName.trim() ? maskName(displayName.trim()) : undefined) : (displayName.trim() || undefined),
        email: hideEmail ? (email.trim() ? maskEmail(email.trim()) : undefined) : (email.trim() || undefined),
        verified_purchase: false, // TODO: Check if customer has purchased
      })

      setSuccess(true)
      setRating(0)
      setTitle("")
      setContent("")
      setDisplayName("")
      setEmail("")
      setHideName(false)
      setHideEmail(false)
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
      <div className="p-4 small:p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
        <Text className="text-sm small:text-base text-green-700 dark:text-green-400">
          Thank you for your review! It will be published after moderation.
        </Text>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 small:space-y-5">
      {/* 错误提示 */}
      {error && (
        <div className="p-3 small:p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
          <Text className="text-sm small:text-base text-red-700 dark:text-red-400 break-words">{error}</Text>
        </div>
      )}

      {/* 评分选择 */}
      <div>
        <Text className="text-sm small:text-base font-semibold mb-2 small:mb-3 block">Rating *</Text>
        <div className="flex items-center gap-1 small:gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none touch-manipulation active:scale-95 transition-transform"
            >
              <svg
                className={clx(
                  "w-7 h-7 small:w-6 small:h-6 transition-colors",
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
            <span className="ml-2 small:ml-3 text-sm small:text-base text-ui-fg-subtle">
              {rating} {rating === 1 ? "star" : "stars"}
            </span>
          )}
        </div>
      </div>

      {/* 标题 */}
      <div>
        <label htmlFor="review-title" className="text-sm small:text-base font-semibold mb-2 small:mb-3 block">
          Title *
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 small:px-3 small:py-2 text-base small:text-sm border border-ui-border-base rounded-md focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive bg-background"
          placeholder="Give your review a title"
          required
        />
      </div>

      {/* 内容 */}
      <div>
        <label htmlFor="review-content" className="text-sm small:text-base font-semibold mb-2 small:mb-3 block">
          Review *
        </label>
        <textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full px-4 py-3 small:px-3 small:py-2 text-base small:text-sm border border-ui-border-base rounded-md focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive resize-y bg-background"
          placeholder="Share your experience with this product"
          required
        />
      </div>

      {/* 匿名评论字段 */}
      {allowAnonymous && (
        <>
          <div>
            <label htmlFor="review-name" className="text-sm small:text-base font-semibold mb-2 small:mb-3 block">
              Your Name <span className="text-xs small:text-sm font-normal text-muted-foreground block small:inline small:ml-1 mt-1 small:mt-0">(at least one of Name or Email is required)</span>
            </label>
            <input
              id="review-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={hideName}
              className={clx(
                "w-full px-4 py-3 small:px-3 small:py-2 text-base small:text-sm border border-ui-border-base rounded-md focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive bg-background",
                hideName && "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              placeholder="Your name"
            />
            <div className="mt-3 small:mt-2 flex items-center justify-between gap-3">
              <label htmlFor="hide-name" className="text-sm small:text-sm text-muted-foreground cursor-pointer leading-relaxed flex-1">
                Hide my name (display as masked, e.g., J***n)
              </label>
              <button
                type="button"
                id="hide-name"
                onClick={() => setHideName(!hideName)}
                className={clx(
                  "relative inline-flex h-6 w-11 small:h-5 small:w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive focus:ring-offset-2",
                  hideName ? "bg-primary" : "bg-ui-border-base"
                )}
                role="switch"
                aria-checked={hideName}
              >
                <span
                  className={clx(
                    "pointer-events-none inline-block h-5 w-5 small:h-4 small:w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    hideName ? "translate-x-5 small:translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>
            {hideName && displayName && (
              <div className="mt-2 text-xs small:text-xs text-muted-foreground bg-muted/50 px-2 py-1.5 rounded">
                Preview: {maskName(displayName)}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="review-email" className="text-sm small:text-base font-semibold mb-2 small:mb-3 block">
              Your Email <span className="text-xs small:text-sm font-normal text-muted-foreground block small:inline small:ml-1 mt-1 small:mt-0">(at least one of Name or Email is required)</span>
            </label>
            <input
              id="review-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={hideEmail}
              className={clx(
                "w-full px-4 py-3 small:px-3 small:py-2 text-base small:text-sm border border-ui-border-base rounded-md focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive bg-background",
                hideEmail && "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              placeholder="your.email@example.com"
            />
            <div className="mt-3 small:mt-2 flex items-center justify-between gap-3">
              <label htmlFor="hide-email" className="text-sm small:text-sm text-muted-foreground cursor-pointer leading-relaxed flex-1">
                Hide my email (display as masked, e.g., a***b@example.com)
              </label>
              <button
                type="button"
                id="hide-email"
                onClick={() => setHideEmail(!hideEmail)}
                className={clx(
                  "relative inline-flex h-6 w-11 small:h-5 small:w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive focus:ring-offset-2",
                  hideEmail ? "bg-primary" : "bg-ui-border-base"
                )}
                role="switch"
                aria-checked={hideEmail}
              >
                <span
                  className={clx(
                    "pointer-events-none inline-block h-5 w-5 small:h-4 small:w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    hideEmail ? "translate-x-5 small:translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>
            {hideEmail && email && (
              <div className="mt-2 text-xs small:text-xs text-muted-foreground bg-muted/50 px-2 py-1.5 rounded">
                Preview: {maskEmail(email)}
              </div>
            )}
          </div>
        </>
      )}

      {/* 提交按钮 */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 small:py-2 text-base small:text-sm font-semibold touch-manipulation"
      >
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>

      <Text className="text-xs small:text-xs text-muted-foreground leading-relaxed px-1">
        * Your review will be published after moderation. Please note that reviews need to be approved before they appear on the product page.
      </Text>
    </form>
  )
}

