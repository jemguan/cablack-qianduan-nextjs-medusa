import { MetadataRoute } from "next"

/**
 * 获取基础 URL
 * 开发环境: http://localhost:8000
 * 生产环境: NEXT_PUBLIC_SITE_URL 或 NEXT_PUBLIC_BASE_URL
 */
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  }

  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "")
  }

  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }

  return "http://localhost:8000"
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/checkout", "/account"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
