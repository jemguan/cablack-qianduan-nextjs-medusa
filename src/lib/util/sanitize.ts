/**
 * HTML 内容消毒工具
 * 用于防止 XSS 攻击，清理不安全的 HTML 内容
 */

// 允许的 HTML 标签白名单
const ALLOWED_TAGS = new Set([
  // 文本格式
  "p",
  "br",
  "hr",
  "span",
  "div",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "del",
  "ins",
  "sub",
  "sup",
  "small",
  "mark",
  "abbr",
  "code",
  "pre",
  "blockquote",
  "q",
  "cite",
  // 标题
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  // 列表
  "ul",
  "ol",
  "li",
  "dl",
  "dt",
  "dd",
  // 表格
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
  "colgroup",
  "col",
  // 链接和媒体
  "a",
  "img",
  "figure",
  "figcaption",
  "picture",
  "source",
  "video",
  "audio",
  // 其他
  "section",
  "article",
  "aside",
  "header",
  "footer",
  "nav",
  "main",
  "details",
  "summary",
  "time",
  "address",
  "wbr",
])

// 允许的属性白名单
const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  "*": new Set([
    "class",
    "id",
    "style",
    "title",
    "lang",
    "dir",
    "data-*",
    "aria-*",
    "role",
  ]),
  a: new Set(["href", "target", "rel", "download"]),
  img: new Set(["src", "alt", "width", "height", "loading", "decoding"]),
  video: new Set([
    "src",
    "poster",
    "controls",
    "autoplay",
    "muted",
    "loop",
    "width",
    "height",
    "preload",
  ]),
  audio: new Set(["src", "controls", "autoplay", "muted", "loop", "preload"]),
  source: new Set(["src", "srcset", "type", "media", "sizes"]),
  picture: new Set([]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan", "scope"]),
  col: new Set(["span"]),
  colgroup: new Set(["span"]),
  time: new Set(["datetime"]),
  abbr: new Set(["title"]),
  blockquote: new Set(["cite"]),
  q: new Set(["cite"]),
  ol: new Set(["start", "type", "reversed"]),
  li: new Set(["value"]),
}

// 危险的 URL 协议
const DANGEROUS_PROTOCOLS = ["javascript:", "data:", "vbscript:"]

// 危险的 CSS 属性
const DANGEROUS_CSS_PROPERTIES = [
  "expression",
  "behavior",
  "-moz-binding",
  "javascript",
]

/**
 * 检查 URL 是否安全
 */
function isSafeUrl(url: string): boolean {
  if (!url) return true

  const trimmedUrl = url.trim().toLowerCase()

  // 检查危险协议
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (trimmedUrl.startsWith(protocol)) {
      return false
    }
  }

  return true
}

/**
 * 清理 CSS 样式
 */
function sanitizeStyle(style: string): string {
  if (!style) return ""

  // 移除危险的 CSS 属性
  let sanitized = style.toLowerCase()
  for (const prop of DANGEROUS_CSS_PROPERTIES) {
    if (sanitized.includes(prop)) {
      return ""
    }
  }

  // 移除 url() 中的危险协议
  sanitized = style.replace(/url\s*\(\s*["']?([^"')]+)["']?\s*\)/gi, (match, url) => {
    if (!isSafeUrl(url)) {
      return ""
    }
    return match
  })

  return sanitized
}

/**
 * 检查属性是否允许
 */
function isAttributeAllowed(tagName: string, attrName: string): boolean {
  const globalAttrs = ALLOWED_ATTRIBUTES["*"]
  const tagAttrs = ALLOWED_ATTRIBUTES[tagName.toLowerCase()]

  // 检查全局属性
  if (globalAttrs) {
    const patterns = Array.from(globalAttrs)
    for (const pattern of patterns) {
      if (pattern.endsWith("*")) {
        const prefix = pattern.slice(0, -1)
        if (attrName.toLowerCase().startsWith(prefix)) {
          return true
        }
      } else if (attrName.toLowerCase() === pattern) {
        return true
      }
    }
  }

  // 检查标签特定属性
  if (tagAttrs && tagAttrs.has(attrName.toLowerCase())) {
    return true
  }

  return false
}

/**
 * HTML 实体编码
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
  }

  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char)
}

/**
 * 消毒 HTML 内容
 * 移除危险的标签、属性和脚本
 *
 * @param html - 需要消毒的 HTML 字符串
 * @param options - 可选配置
 * @returns 消毒后的安全 HTML 字符串
 */
export function sanitizeHtml(
  html: string | null | undefined,
  options: {
    allowedTags?: Set<string>
    allowedAttributes?: Record<string, Set<string>>
    stripTags?: boolean // 如果为 true，则完全移除不允许的标签；否则转义它们
  } = {}
): string {
  if (!html) return ""

  const allowedTags = options.allowedTags || ALLOWED_TAGS
  const stripTags = options.stripTags ?? true

  // 移除 script 和 style 标签及其内容
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")

  // 移除事件处理程序属性 (on*)
  sanitized = sanitized.replace(
    /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi,
    ""
  )

  // 移除 javascript: 和其他危险协议
  sanitized = sanitized.replace(
    /\s+href\s*=\s*["']?\s*javascript:[^"'>\s]*/gi,
    ""
  )
  sanitized = sanitized.replace(
    /\s+src\s*=\s*["']?\s*javascript:[^"'>\s]*/gi,
    ""
  )

  // 处理标签
  sanitized = sanitized.replace(
    /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g,
    (match, tagName, attrs) => {
      const lowerTagName = tagName.toLowerCase()

      // 检查标签是否允许
      if (!allowedTags.has(lowerTagName)) {
        return stripTags ? "" : escapeHtml(match)
      }

      // 处理结束标签
      if (match.startsWith("</")) {
        return `</${lowerTagName}>`
      }

      // 处理属性
      let sanitizedAttrs = ""
      const attrRegex = /([a-zA-Z][a-zA-Z0-9\-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*))/g
      let attrMatch

      while ((attrMatch = attrRegex.exec(attrs)) !== null) {
        const attrName = attrMatch[1]
        const attrValue = attrMatch[2] || attrMatch[3] || attrMatch[4] || ""

        // 检查属性是否允许
        if (!isAttributeAllowed(lowerTagName, attrName)) {
          continue
        }

        // 特殊处理 href 和 src 属性
        if (
          (attrName.toLowerCase() === "href" ||
            attrName.toLowerCase() === "src") &&
          !isSafeUrl(attrValue)
        ) {
          continue
        }

        // 特殊处理 style 属性
        if (attrName.toLowerCase() === "style") {
          const sanitizedStyle = sanitizeStyle(attrValue)
          if (sanitizedStyle) {
            sanitizedAttrs += ` ${attrName}="${escapeHtml(sanitizedStyle)}"`
          }
          continue
        }

        // 对于链接，强制添加安全的 rel 属性
        if (lowerTagName === "a" && attrName.toLowerCase() === "target") {
          if (attrValue === "_blank") {
            sanitizedAttrs += ` ${attrName}="${escapeHtml(attrValue)}"`
            // 确保有 noopener noreferrer
            if (!attrs.toLowerCase().includes("rel=")) {
              sanitizedAttrs += ' rel="noopener noreferrer"'
            }
            continue
          }
        }

        sanitizedAttrs += ` ${attrName}="${escapeHtml(attrValue)}"`
      }

      // 处理自闭合标签
      const selfClosingTags = new Set([
        "img",
        "br",
        "hr",
        "input",
        "meta",
        "link",
        "col",
        "source",
        "wbr",
      ])
      const selfClose = selfClosingTags.has(lowerTagName) ? " /" : ""

      return `<${lowerTagName}${sanitizedAttrs}${selfClose}>`
    }
  )

  return sanitized
}

/**
 * 创建安全的 dangerouslySetInnerHTML 对象
 *
 * @param html - 需要消毒的 HTML 字符串
 * @returns 可直接用于 dangerouslySetInnerHTML 的对象
 */
export function createSafeHtml(html: string | null | undefined): {
  __html: string
} {
  return { __html: sanitizeHtml(html) }
}

/**
 * 纯文本消毒 - 将所有 HTML 标签转义
 *
 * @param text - 需要转义的文本
 * @returns 转义后的安全文本
 */
export function escapeText(text: string | null | undefined): string {
  if (!text) return ""
  return escapeHtml(text)
}

export default sanitizeHtml

