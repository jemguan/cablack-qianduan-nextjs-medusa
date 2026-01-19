/**
 * Get the full image URL from a relative or absolute URL
 * If the URL is relative, prepend the Medusa backend URL
 * Handles both local storage and S3 storage URLs
 */
// Fallback placeholder image
const PLACEHOLDER_IMAGE = "/placeholder.png"

export function getImageUrl(url: string | null | undefined): string {
  if (!url) {
    return PLACEHOLDER_IMAGE
  }

  // If URL is already absolute (starts with http:// or https://), return as is
  // This includes S3 URLs like https://bucket.s3.region.amazonaws.com/path/to/image.jpg
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }

  // If URL is relative, prepend the backend URL
  // This handles local storage URLs like /uploads/image.jpg
  // 优先使用客户端环境变量（NEXT_PUBLIC_*），如果没有则使用服务端环境变量
  const backendUrl = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000")
    : (process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000")
  
  // Remove trailing slash from backend URL if present
  const baseUrl = backendUrl.replace(/\/$/, "")
  
  // Ensure URL starts with /
  const imagePath = url.startsWith("/") ? url : `/${url}`
  
  return `${baseUrl}${imagePath}`
}

/**
 * Generate a blur placeholder data URL for images
 * This is a 10x10 pixel light gray image encoded as base64
 * Used to prevent layout shift while images are loading
 * Next.js will automatically blur this placeholder
 * Uses a neutral light gray color (#E5E7EB) that matches typical UI backgrounds
 */
export function generateBlurPlaceholder(): string {
  // 10x10 pixel light gray PNG encoded as base64
  // Color: RGB(229, 231, 235) - neutral light gray (#E5E7EB)
  // This creates a neutral placeholder that prevents layout shift
  // Next.js Image component will blur this automatically
  // Pre-encoded base64 of a 10x10 gray PNG
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVQYV2NkYGD4Twzw6FjzQEhISBkMBQAADgoCBTkCqQAAAABJRU5ErkJggg=='
}

