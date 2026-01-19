"use client"

import Image from "next/image"

interface ProductImageProps {
  src: string | null
  alt: string
  size?: "small" | "medium" | "large"
  className?: string
}

const sizeClasses = {
  small: "w-14 h-14",
  medium: "w-24 small:w-20 h-24 small:h-20",
  large: "w-full small:w-14 h-32 small:h-14",
}

/**
 * 产品图片组件，带有占位符
 */
export function ProductImage({
  src,
  alt,
  size = "medium",
  className = "",
}: ProductImageProps) {
  const sizeClass = sizeClasses[size]
  const imageSize = size === "small" ? 56 : 96

  return (
    <div
      className={`${sizeClass} bg-muted rounded-lg overflow-hidden flex-shrink-0 ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={imageSize}
          height={imageSize}
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={size === "small" ? "h-6 w-6" : "h-8 w-8"}
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
  )
}
