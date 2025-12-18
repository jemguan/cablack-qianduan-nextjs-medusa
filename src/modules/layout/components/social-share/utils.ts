import type { SocialPlatform } from "./types"

/**
 * 生成分享 URL
 */
export function generateShareUrl(
  platform: SocialPlatform,
  url: string,
  title?: string,
  description?: string,
  image?: string
): string {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title || "")
  const encodedDescription = encodeURIComponent(description || "")
  const encodedImage = encodeURIComponent(image || "")

  switch (platform) {
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`

    case "twitter":
      const twitterText = title
        ? `${encodedTitle}${description ? ` - ${encodedDescription}` : ""}`
        : encodedDescription
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${twitterText}`

    case "instagram":
      // Instagram 不支持直接分享链接，跳转到 Instagram 主页
      return `https://www.instagram.com/`

    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`

    case "pinterest":
      return `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedTitle}`

    case "whatsapp":
      const whatsappText = title
        ? `${title}${description ? ` - ${description}` : ""} ${url}`
        : url
      return `https://wa.me/?text=${encodeURIComponent(whatsappText)}`

    case "email":
      const emailSubject = title || "Check this out"
      const emailBody = `${description || ""}\n\n${url}`
      return `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`

    default:
      return url
  }
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // 降级方案
      const textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      textArea.style.top = "-999999px"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const successful = document.execCommand("copy")
      textArea.remove()
      return successful
    }
  } catch (err) {
    console.error("Failed to copy:", err)
    return false
  }
}

/**
 * 获取当前页面 URL
 */
export function getCurrentUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.href
  }
  return ""
}

/**
 * 获取当前页面标题
 */
export function getCurrentTitle(): string {
  if (typeof document !== "undefined") {
    return document.title
  }
  return ""
}

/**
 * 获取当前页面描述
 */
export function getCurrentDescription(): string {
  if (typeof document !== "undefined") {
    const metaDescription = document.querySelector(
      'meta[name="description"]'
    ) as HTMLMetaElement
    return metaDescription?.content || ""
  }
  return ""
}

/**
 * 获取当前页面图片
 */
export function getCurrentImage(): string {
  if (typeof document !== "undefined") {
    const ogImage = document.querySelector(
      'meta[property="og:image"]'
    ) as HTMLMetaElement
    return ogImage?.content || ""
  }
  return ""
}

