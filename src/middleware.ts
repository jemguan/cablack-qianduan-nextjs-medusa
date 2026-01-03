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
 * 添加安全响应头
 * 防止常见的 Web 攻击（XSS、点击劫持、MIME 嗅探等）
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // 防止点击劫持 - 禁止在 iframe 中嵌入
  response.headers.set("X-Frame-Options", "DENY")

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
 * Middleware to handle region cookie, legacy URL redirects, and security headers.
 * No longer adds countryCode to URLs - region is stored in cookie only.
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

    // Add security headers to redirect response
    return addSecurityHeaders(response)
  }

  // Normal request - ensure cookies are set
  const regionCookie = request.cookies.get("_medusa_region")

  // If no region cookie, set it to default
  if (!regionCookie || !cacheIdCookie) {
    const response = NextResponse.next()

    if (!regionCookie) {
      response.cookies.set("_medusa_region", DEFAULT_REGION, {
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

    // Add security headers
    return addSecurityHeaders(response)
  }

  // Add security headers to normal response
  const response = NextResponse.next()
  return addSecurityHeaders(response)
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
