import { sdk } from "@lib/config"
import { getCacheConfig } from "@lib/config/cache"
import { unstable_cache } from "next/cache"
import { escapeText } from "@lib/util/sanitize"

export type PageTitleConfig = {
  site_name: string
  logo_url?: string | null
  title_templates?: Record<string, string> | null
  default_template?: string | null
  homepage_seo_title?: string | null
  homepage_seo_description?: string | null
  organization_name?: string | null
  organization_logo_url?: string | null
  organization_social_links?: string[] | null
  website_name?: string | null
  website_search_url?: string | null
}

const DEFAULT_CONFIG: PageTitleConfig = {
  site_name: "",
  logo_url: null,
  title_templates: {},
  default_template: "{siteName} - {title}",
  homepage_seo_title: null,
  homepage_seo_description: null,
  organization_name: null,
  organization_logo_url: null,
  organization_social_links: null,
  website_name: null,
  website_search_url: null,
}

/**
 * 获取页面标题配置（使用 Next.js 缓存）
 * 配置变化频率低，使用长期缓存（2小时）
 */
async function fetchPageTitleConfigInternal(): Promise<PageTitleConfig> {
  try {
    const cacheConfig = getCacheConfig("STATIC") // 使用 STATIC 策略（2小时缓存）

    const response = await sdk.client.fetch<{ config: PageTitleConfig }>(
      "/store/page-title-config",
      {
        method: "GET",
        ...cacheConfig,
      }
    )

    return response.config || DEFAULT_CONFIG
  } catch (error) {
    console.error("Failed to fetch page title config:", error)
    return DEFAULT_CONFIG
  }
}

/**
 * 获取页面标题配置（带缓存）
 * 使用 Next.js unstable_cache 进行服务端缓存
 */
export async function getPageTitleConfig(): Promise<PageTitleConfig> {
  // 使用 unstable_cache 进行服务端缓存（2小时）
  const cachedFetch = unstable_cache(
    async () => fetchPageTitleConfigInternal(),
    ["page-title-config"],
    {
      revalidate: 7200, // 2小时
      tags: ["page-title-config"],
    }
  )

  return cachedFetch()
}

// 预编译的正则表达式缓存
const regexCache = new Map<string, RegExp>()

/**
 * 获取或创建正则表达式（带缓存）
 */
function getRegex(pattern: string): RegExp {
  if (!regexCache.has(pattern)) {
    regexCache.set(pattern, new RegExp(pattern, "g"))
  }
  return regexCache.get(pattern)!
}

/**
 * 渲染标题模板（支持变量替换）
 * 所有变量值都会进行 HTML 转义以防止 XSS
 */
export function renderTitleTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    // 转义变量值以防止 XSS
    const escapedValue = escapeText(value)
    const pattern = `\\{${key}\\}`
    const regex = getRegex(pattern)
    result = result.replace(regex, escapedValue)
  }
  return result
}

/**
 * 获取页面标题
 */
export async function getPageTitle(
  pageType: string,
  variables: Record<string, string> = {}
): Promise<string> {
  const config = await getPageTitleConfig()

  // 从 title_templates 中获取对应页面类型的模板
  const templates = config.title_templates || {}
  let template = templates[pageType]

  // 如果没有找到对应页面类型的模板，使用默认模板
  if (!template && config.default_template) {
    template = config.default_template
  }

  // 如果还是没有模板，使用默认格式
  if (!template) {
    template = "{siteName} - {title}"
  }

  // 确保 siteName 变量存在
  const allVariables = {
    siteName: config.site_name || "",
    ...variables,
  }

  return renderTitleTemplate(template, allVariables)
}

