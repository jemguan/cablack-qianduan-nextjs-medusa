import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  // 优先使用 NEXT_PUBLIC_SITE_URL，然后是 NEXT_PUBLIC_BASE_URL，最后是 NEXT_PUBLIC_VERCEL_URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.replace(":9000", ":8000") ||
        "http://localhost:8000")

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

