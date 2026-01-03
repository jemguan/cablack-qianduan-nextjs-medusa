"use client"

import React, { useMemo } from "react"
import Accordion from "../product-tabs/accordion"
import { sanitizeHtml } from "@lib/util/sanitize"

type ProductDescriptionAccordionProps = {
  htmlDescription: string
}

/**
 * 解析 HTML 描述并创建折叠组件
 * 识别特定的标题并并将内容折叠到对应的框里
 * 支持的标题：
 * - DOLL DESCRIPTION
 * - DOLL SPECIFICATIONS
 * - DOLL MEASUREMENTS
 * - BRAND & AGENCY
 * - PRODUCTION & SHIPPING
 * - PRODUCT FEATURES
 * - PRODUCT DESCRIPTION
 * - USAGE RECOMMENDATIONS
 * - PRODUCT SPECIFICATIONS
 */
const ProductDescriptionAccordion: React.FC<ProductDescriptionAccordionProps> = ({
  htmlDescription,
}) => {
  // 定义要识别的标题
  const sectionTitles = [
    "DOLL DESCRIPTION",
    "DOLL SPECIFICATIONS",
    "DOLL MEASUREMENTS",
    "BRAND & AGENCY",
    "PRODUCTION & SHIPPING",
    "PRODUCT FEATURES",
    "PRODUCT DESCRIPTION",
    "USAGE RECOMMENDATIONS",
    "PRODUCT SPECIFICATIONS",
  ]

  // 解析 HTML 并提取章节
  const sections = useMemo(() => {
    if (!htmlDescription) return []

    const extractedSections: Array<{ title: string; content: string }> = []

    // 使用正则表达式直接分割 HTML 内容
    // 构建匹配所有标题的正则表达式
    const titlePattern = sectionTitles
      .map((title) => title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|")

    // 匹配标题和内容的正则表达式
    // 匹配格式：<tag>标题</tag> 或 标题 后面跟着内容
    const regex = new RegExp(
      `(<[^>]*>\\s*)?(${titlePattern})(\\s*</[^>]*>)?([\\s\\S]*?)(?=(<[^>]*>\\s*)?(${titlePattern})(\\s*</[^>]*>)?|$)`,
      "gi"
    )

    let match
    const matches: Array<{ title: string; content: string; index: number }> = []

    // 找到所有匹配
    while ((match = regex.exec(htmlDescription)) !== null) {
      const titleMatch = match[2] // 标题文本
      const contentMatch = match[4] || "" // 内容

      // 找到对应的原始标题（保持大小写）
      const originalTitle = sectionTitles.find(
        (t) => t.toUpperCase() === titleMatch.toUpperCase()
      )

      if (originalTitle && contentMatch.trim()) {
        matches.push({
          title: originalTitle,
          content: contentMatch.trim(),
          index: match.index,
        })
      }
    }

    // 如果正则匹配失败，尝试使用 DOM 解析
    if (matches.length === 0) {
      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlDescription, "text/html")
      const body = doc.body

      // 查找包含标题的元素
      for (const title of sectionTitles) {
        const titleRegex = new RegExp(
          `^\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`,
          "i"
        )

        // 查找所有元素
        const allElements = Array.from(body.querySelectorAll("*"))
        const titleElements: Element[] = []

        for (const element of allElements) {
          const text = (element.textContent || "").trim()
          if (titleRegex.test(text)) {
            titleElements.push(element)
          }
        }

        // 如果找到标题元素，提取其后的内容
        for (const titleElement of titleElements) {
          const contentParts: string[] = []
          let currentElement: Element | null = titleElement.nextElementSibling

          // 收集直到下一个标题的内容
          while (currentElement) {
            const currentText = (currentElement.textContent || "").trim().toUpperCase()
            const isNextTitle = sectionTitles.some(
              (t) =>
                t.toUpperCase() !== title.toUpperCase() &&
                (currentText === t.toUpperCase() ||
                  currentText.startsWith(t.toUpperCase()))
            )

            if (isNextTitle) {
              break
            }

            contentParts.push(currentElement.outerHTML)
            currentElement = currentElement.nextElementSibling
          }

          const content = contentParts.join("").trim()

          if (content) {
            extractedSections.push({
              title,
              content,
            })
            break // 只取第一个匹配的标题
          }
        }
      }
    } else {
      // 使用正则匹配的结果
      matches.forEach((match) => {
        extractedSections.push({
          title: match.title,
          content: match.content,
        })
      })
    }

    // 去重（保留第一个）
    const uniqueSections: Array<{ title: string; content: string }> = []
    const seenTitles = new Set<string>()

    for (const section of extractedSections) {
      if (!seenTitles.has(section.title.toUpperCase())) {
        seenTitles.add(section.title.toUpperCase())
        uniqueSections.push(section)
      }
    }

    return uniqueSections
  }, [htmlDescription, sectionTitles])

  // 如果没有找到任何章节，直接显示原始 HTML
  if (sections.length === 0) {
    return (
      <div
        className="text-medium text-ui-fg-subtle prose prose-sm max-w-none dark:prose-invert
          prose-headings:text-ui-fg-base
          prose-p:text-ui-fg-subtle
          prose-a:text-ui-fg-interactive prose-a:no-underline hover:prose-a:underline
          prose-strong:text-ui-fg-base
          prose-code:text-ui-fg-base prose-code:bg-ui-bg-subtle prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-ui-bg-subtle prose-pre:text-ui-fg-base
          prose-img:rounded-lg prose-img:my-4
          prose-blockquote:border-l-ui-border-base prose-blockquote:text-ui-fg-subtle
          prose-ul:text-ui-fg-subtle prose-ol:text-ui-fg-subtle
          prose-li:text-ui-fg-subtle
          prose-hr:border-ui-border-base
          [&_input]:bg-background [&_input]:text-foreground [&_input]:border-input [&_input]:rounded-md [&_input]:px-3 [&_input]:py-2
          dark:[&_input]:bg-background dark:[&_input]:text-foreground dark:[&_input]:border-input
          [&_textarea]:bg-background [&_textarea]:text-foreground [&_textarea]:border-input [&_textarea]:rounded-md [&_textarea]:px-3 [&_textarea]:py-2
          dark:[&_textarea]:bg-background dark:[&_textarea]:text-foreground dark:[&_textarea]:border-input
          [&_select]:bg-background [&_select]:text-foreground [&_select]:border-input [&_select]:rounded-md [&_select]:px-3 [&_select]:py-2
          dark:[&_select]:bg-background dark:[&_select]:text-foreground dark:[&_select]:border-input
          [&_button]:bg-primary [&_button]:text-primary-foreground [&_button]:rounded-md [&_button]:px-4 [&_button]:py-2 [&_button]:transition-colors
          dark:[&_button]:bg-primary dark:[&_button]:text-primary-foreground"
        data-testid="product-html-description"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlDescription) }}
      />
    )
  }

  // 默认打开第一个
  const defaultValue = sections.length > 0 ? `section-0` : undefined

  return (
    <div data-testid="product-description-accordion">
      <Accordion type="single" defaultValue={defaultValue} collapsible>
        {sections.map((section, index) => (
          <Accordion.Item
            key={`section-${index}`}
            value={`section-${index}`}
            title={section.title}
            className="border-ui-border-base"
          >
            <div
              className="text-medium text-ui-fg-subtle prose prose-sm max-w-none dark:prose-invert
                prose-headings:text-ui-fg-base
                prose-p:text-ui-fg-subtle
                prose-a:text-ui-fg-interactive prose-a:no-underline hover:prose-a:underline
                prose-strong:text-ui-fg-base
                prose-code:text-ui-fg-base prose-code:bg-ui-bg-subtle prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                prose-pre:bg-ui-bg-subtle prose-pre:text-ui-fg-base
                prose-img:rounded-lg prose-img:my-4
                prose-blockquote:border-l-ui-border-base prose-blockquote:text-ui-fg-subtle
                prose-ul:text-ui-fg-subtle prose-ol:text-ui-fg-subtle
                prose-li:text-ui-fg-subtle
                prose-hr:border-ui-border-base
                [&_input]:bg-background [&_input]:text-foreground [&_input]:border-input [&_input]:rounded-md [&_input]:px-3 [&_input]:py-2
                dark:[&_input]:bg-background dark:[&_input]:text-foreground dark:[&_input]:border-input
                [&_textarea]:bg-background [&_textarea]:text-foreground [&_textarea]:border-input [&_textarea]:rounded-md [&_textarea]:px-3 [&_textarea]:py-2
                dark:[&_textarea]:bg-background dark:[&_textarea]:text-foreground dark:[&_textarea]:border-input
                [&_select]:bg-background [&_select]:text-foreground [&_select]:border-input [&_select]:rounded-md [&_select]:px-3 [&_select]:py-2
                dark:[&_select]:bg-background dark:[&_select]:text-foreground dark:[&_select]:border-input
                [&_button]:bg-primary [&_button]:text-primary-foreground [&_button]:rounded-md [&_button]:px-4 [&_button]:py-2 [&_button]:transition-colors
                dark:[&_button]:bg-primary dark:[&_button]:text-primary-foreground"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.content) }}
            />
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

export default ProductDescriptionAccordion

