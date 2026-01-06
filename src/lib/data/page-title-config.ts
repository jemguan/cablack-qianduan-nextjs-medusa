import { sdk } from "@lib/config"

export type PageTitleConfig = {
  site_name: string
  logo_url?: string | null
  title_templates?: Record<string, string> | null
  default_template?: string | null
}

let cachedConfig: PageTitleConfig | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 分钟缓存

/**
 * 获取页面标题配置
 */
export async function getPageTitleConfig(): Promise<PageTitleConfig> {
  const now = Date.now()

  // 如果缓存有效，直接返回
  if (cachedConfig && now - cacheTimestamp < CACHE_DURATION) {
    return cachedConfig
  }

  try {
    const response = await sdk.client.fetch<{ config: PageTitleConfig }>(
      "/store/page-title-config",
      {
        method: "GET",
      }
    )

    cachedConfig = response.config || {
      site_name: "",
      logo_url: null,
      title_templates: {},
      default_template: "{siteName} - {title}",
    }
    cacheTimestamp = now

    return cachedConfig
  } catch (error) {
    console.error("Failed to fetch page title config:", error)
    // 返回默认配置
    return {
      site_name: "",
      logo_url: null,
      title_templates: {},
      default_template: "{siteName} - {title}",
    }
  }
}

/**
 * 渲染标题模板（支持变量替换）
 */
export function renderTitleTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, "g")
    result = result.replace(regex, value)
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

