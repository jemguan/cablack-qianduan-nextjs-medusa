/**
 * Get the full image URL from a relative or absolute URL
 * If the URL is relative, prepend the Medusa backend URL
 * Handles both local storage and S3 storage URLs
 */
export function getImageUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null
  }

  // If URL is already absolute (starts with http:// or https://), return as is
  // This includes S3 URLs like https://bucket.s3.region.amazonaws.com/path/to/image.jpg
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }

  // If URL is relative, prepend the backend URL
  // This handles local storage URLs like /uploads/image.jpg
  const backendUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
  
  // Remove trailing slash from backend URL if present
  const baseUrl = backendUrl.replace(/\/$/, "")
  
  // Ensure URL starts with /
  const imagePath = url.startsWith("/") ? url : `/${url}`
  
  return `${baseUrl}${imagePath}`
}

