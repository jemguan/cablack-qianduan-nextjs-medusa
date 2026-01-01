"use client"

import { clx } from "@medusajs/ui"

interface RatingDisplayProps {
  rating: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  showNumber?: boolean
  className?: string
}

/**
 * 评分显示组件
 * 显示星级评分
 */
export default function RatingDisplay({
  rating,
  maxRating = 5,
  size = "md",
  showNumber = false,
  className,
}: RatingDisplayProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }

  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className={clx("flex items-center gap-1", className)}>
      {/* 填充的星星 */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} filled={true} size={sizeClasses[size]} />
      ))}

      {/* 半星 */}
      {hasHalfStar && (
        <Star key="half" filled={false} half={true} size={sizeClasses[size]} />
      )}

      {/* 空星星 */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} filled={false} size={sizeClasses[size]} />
      ))}

      {/* 显示数字评分 */}
      {showNumber && (
        <span className="ml-1 text-sm text-ui-fg-subtle">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

interface StarProps {
  filled: boolean
  half?: boolean
  size: string
}

function Star({ filled, half, size }: StarProps) {
  if (half) {
    return (
      <svg
        className={clx("text-yellow-400", size)}
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="half-fill">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          fill="url(#half-fill)"
        />
      </svg>
    )
  }

  return (
    <svg
      className={clx(
        filled ? "text-yellow-400" : "text-ui-border-base",
        size
      )}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={filled ? 0 : 1}
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
      />
    </svg>
  )
}

