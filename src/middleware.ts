import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = "ca"

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

/**
 * 构建 Content-Security-Policy 头
 * 基于项目需求配置安全策略
 */
function buildContentSecurityPolicy(): string {
  const backendUrl = BACKEND_URL || ""
  
  // 解析后端 URL 的域名用于 CSP
  let backendHost = ""
  try {
    if (backendUrl) {
      backendHost = new URL(backendUrl).origin
    }
  } catch {
    // 忽略解析错误
  }

  const directives = [
    // 默认策略：只允许同源
    "default-src 'self'",
    // 脚本：允许同源、内联脚本（Next.js 需要）、Stripe、Cloudflare Insights
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://m.stripe.com https://static.cloudflareinsights.com",
    // 样式：允许同源、内联样式
    "style-src 'self' 'unsafe-inline'",
    // 图片：允许同源、data URL、常见 CDN、图标库和后端
    `img-src 'self' data: blob: https://*.amazonaws.com https://*.cloudfront.net https://*.digitaloceanspaces.com https://cdn.shopify.com https://logo.clearbit.com ${backendHost}`.trim(),
    // 字体：允许同源和 data URL
    "font-src 'self' data:",
    // 连接：允许同源、后端 API、Stripe 和 Cloudflare Insights
    `connect-src 'self' ${backendHost} https://api.stripe.com https://m.stripe.com wss://*.stripe.com https://cloudflareinsights.com`.trim(),
    // frame：允许 Stripe iframe
    "frame-src 'self' https://js.stripe.com https://m.stripe.com https://hooks.stripe.com",
    // 表单：只允许同源
    "form-action 'self'",
    // 基础 URI：只允许同源
    "base-uri 'self'",
    // 对象：禁用
    "object-src 'none'",
    // 升级不安全请求（生产环境）
    ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
  ]

  return directives.join("; ")
}

/**
 * 添加安全响应头
 * 防止常见的 Web 攻击（XSS、点击劫持、MIME 嗅探等）
 */
function addSecurityHeaders(response: NextResponse, pathname: string): NextResponse {
  const isPreviewPath = pathname.startsWith("/preview/")
  
  if (!isPreviewPath) {
    response.headers.set("X-Frame-Options", "DENY")
  }

  // 防止 MIME 类型嗅探
  response.headers.set("X-Content-Type-Options", "nosniff")

  // XSS 保护（现代浏览器已内置，但为旧浏览器保留）
  response.headers.set("X-XSS-Protection", "1; mode=block")

  // 引用来源策略 - 控制 Referer 头的发送
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  // 权限策略 - 禁用不需要的浏览器功能
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  )

  // 内容安全策略 (CSP)
  response.headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy()
  )

  // 强制 HTTPS（生产环境）
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    )
  }

  return response
}

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) {
    throw new Error(
      "Middleware.ts: Error fetching regions. Did you set up regions in your Medusa Admin and define a MEDUSA_BACKEND_URL environment variable? Note that the variable is no longer named NEXT_PUBLIC_MEDUSA_BACKEND_URL."
    )
  }

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    // Fetch regions from Medusa. We can't use the JS client here because middleware is running on Edge and the client needs a Node environment.
    const fetchOptions: RequestInit = {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY!,
      },
    }

    if (process.env.NODE_ENV === "development") {
      fetchOptions.cache = "no-store"
    } else {
      fetchOptions.cache = "force-cache"
      fetchOptions.next = {
        revalidate: 3600,
        tags: [`regions-${cacheId}`],
      }
    }

    const { regions } = await fetch(
      `${BACKEND_URL}/store/regions`,
      fetchOptions
    ).then(async (response) => {
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.message)
      }

      return json
    })

    if (!regions?.length) {
      throw new Error(
        "No regions found. Please set up regions in your Medusa Admin."
      )
    }

    // Create a map of country codes to regions.
    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMapCache.regionMap.set(c.iso_2 ?? "", region)
      })
    })

    regionMapCache.regionMapUpdated = Date.now()
  }

  return regionMapCache.regionMap
}

/**
 * 从请求头中检测用户的国家代码
 * 支持多种 CDN/代理服务提供的国家代码头
 */
function detectCountryFromRequest(request: NextRequest): string | null {
  // Cloudflare 提供的国家代码头
  const cfCountry = request.headers.get("cf-ipcountry")
  if (cfCountry && cfCountry.length === 2) {
    return cfCountry.toLowerCase()
  }

  // Vercel 提供的国家代码头
  const vercelCountry = request.headers.get("x-vercel-ip-country")
  if (vercelCountry && vercelCountry.length === 2) {
    return vercelCountry.toLowerCase()
  }

  // 其他可能的请求头（根据实际使用的 CDN/代理服务调整）
  const cloudflareCountry = request.headers.get("CF-IPCountry")
  if (cloudflareCountry && cloudflareCountry.length === 2) {
    return cloudflareCountry.toLowerCase()
  }

  // 如果都没有，返回 null
  return null
}

/**
 * Middleware to handle region cookie, legacy URL redirects, and security headers.
 * No longer adds countryCode to URLs - region is stored in cookie only.
 * Now includes IP-based country detection for first-time visitors.
 */
export async function middleware(request: NextRequest) {
  // Check if the url is a static asset
  if (request.nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  let cacheIdCookie = request.cookies.get("_medusa_cache_id")
  let cacheId = cacheIdCookie?.value || crypto.randomUUID()

  const regionMap = await getRegionMap(cacheId)

  // Get the first path segment to check for legacy countryCode URLs
  const pathSegments = request.nextUrl.pathname.split("/").filter(Boolean)
  const firstSegment = pathSegments[0]?.toLowerCase()

  // Check if the URL starts with a country code (legacy URL)
  const isLegacyUrl = firstSegment && regionMap.has(firstSegment)

  if (isLegacyUrl) {
    // Redirect legacy URLs (e.g., /ca/products/xxx) to new URLs (e.g., /products/xxx)
    const newPathname = "/" + pathSegments.slice(1).join("/")
    const queryString = request.nextUrl.search || ""
    const redirectUrl = `${request.nextUrl.origin}${newPathname || "/"}${queryString}`

    const response = NextResponse.redirect(redirectUrl, 301)

    // Set the region cookie based on the legacy URL's country code
    response.cookies.set("_medusa_region", firstSegment, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    // Set cache id if not present
    if (!cacheIdCookie) {
      response.cookies.set("_medusa_cache_id", cacheId, {
        maxAge: 60 * 60 * 24,
      })
    }

    return addSecurityHeaders(response, request.nextUrl.pathname)
  }

  // Check for affiliate code in URL parameter (?ref=KOL_CODE)
  const affiliateCode = request.nextUrl.searchParams.get("ref")
  const affiliateTid = request.nextUrl.searchParams.get("tid")
  const affiliateCookie = request.cookies.get("_affiliate_code")
  const affiliateTidCookie = request.cookies.get("_affiliate_tid")

  // Normal request - ensure cookies are set
  const regionCookie = request.cookies.get("_medusa_region")

  // If no region cookie, try to detect country from IP and set region accordingly
  if (!regionCookie || !cacheIdCookie || (affiliateCode && !affiliateCookie)) {
    const response = NextResponse.next()

    if (!regionCookie) {
      // 尝试从 IP 检测国家代码
      const detectedCountry = detectCountryFromRequest(request)
      
      // 确定要使用的国家代码
      let countryCodeToUse = DEFAULT_REGION
      
      if (detectedCountry) {
        // 检查检测到的国家是否在可用区域中
        if (regionMap.has(detectedCountry)) {
          countryCodeToUse = detectedCountry
        } else {
          // 如果检测到的国家不在可用区域中，使用默认区域
          // 可以选择记录日志或使用默认值
          countryCodeToUse = DEFAULT_REGION
        }
      }

      response.cookies.set("_medusa_region", countryCodeToUse, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
    }

    if (!cacheIdCookie) {
      response.cookies.set("_medusa_cache_id", cacheId, {
        maxAge: 60 * 60 * 24,
      })
    }

    // Set affiliate code cookie if present in URL (有效期 30 天)
    if (affiliateCode && affiliateCode !== affiliateCookie?.value) {
      response.cookies.set("_affiliate_code", affiliateCode, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      })
    }
    
    // Set affiliate tid cookie if present in URL
    if (affiliateTid && affiliateTid !== affiliateTidCookie?.value) {
      response.cookies.set("_affiliate_tid", affiliateTid, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      })
    }

    return addSecurityHeaders(response, request.nextUrl.pathname)
  }

  const response = NextResponse.next()
  
  // Set affiliate code cookie if present in URL (even if other cookies are set)
  if (affiliateCode && affiliateCode !== affiliateCookie?.value) {
    response.cookies.set("_affiliate_code", affiliateCode, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    })
  }
  
  // Set affiliate tid cookie if present in URL
  if (affiliateTid && affiliateTid !== affiliateTidCookie?.value) {
    response.cookies.set("_affiliate_tid", affiliateTid, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    })
  }
  
  return addSecurityHeaders(response, request.nextUrl.pathname)
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
