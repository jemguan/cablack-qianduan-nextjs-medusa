import { PageData } from "@lib/data/pages"
import Link from "next/link"
import { getImageUrl } from "@lib/util/image"
import { sanitizeHtml } from "@lib/util/sanitize"
import { FAQBlock } from "@modules/home/components/faq-block"
import { ContactForm } from "@modules/pages/components/contact-form"
import ChevronLeft from "@modules/common/icons/chevron-left"
import { Button } from "@medusajs/ui"

export default function PageDetailTemplate({
  page,
}: {
  page: PageData
}) {
  // Process image URLs in content
  const processContentImages = (html: string | null | undefined): string => {
    if (!html) return ""
    
    // Use regex to match img tags and their src attributes
    return html.replace(
      /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
      (match, beforeSrc, src, afterSrc) => {
        const fullImageUrl = getImageUrl(src) || src
        return `<img${beforeSrc}src="${fullImageUrl}"${afterSrc}>`
      }
    )
  }

  // Process images and sanitize HTML content for XSS protection
  const processedContent = sanitizeHtml(processContentImages(page.content))

  // 获取 FAQ 配置和数据
  const layoutConfig = page.layout_config || {}
  const faqConfig = layoutConfig.faq || {}
  
  // 从 metadata 中获取 FAQ 数据
  let faqData: Array<{ id: string; question: string; answer: string }> = []
  
  if (page.metadata) {
    // 尝试多种方式获取 FAQ 数据
    if (Array.isArray(page.metadata.faq)) {
      faqData = page.metadata.faq
    } else if (page.metadata.faq && typeof page.metadata.faq === 'string') {
      // 如果是字符串，尝试解析 JSON
      try {
        const parsed = JSON.parse(page.metadata.faq)
        faqData = Array.isArray(parsed) ? parsed : []
      } catch (e) {
        console.error('[PageDetail] Failed to parse FAQ metadata string:', e)
      }
    } else if (page.metadata.faq && typeof page.metadata.faq === 'object') {
      // 如果是对象，尝试转换为数组
      if (Array.isArray(page.metadata.faq)) {
        faqData = page.metadata.faq
      }
    }
  }
  
  // 验证 FAQ 数据格式
  faqData = faqData.filter(item => 
    item && 
    typeof item === 'object' && 
    typeof item.id === 'string' && 
    typeof item.question === 'string' && 
    typeof item.answer === 'string'
  )
  
  // 如果 layout_config 中没有明确禁用，且有 FAQ 数据，则显示
  // 默认启用（如果 layout_config 不存在或 faq.enabled 未设置）
  const showFaq = faqConfig.enabled !== false && faqData.length > 0

  // 联系表单配置
  const contactConfig = layoutConfig.contactForm || {}
  const showContactForm = contactConfig.enabled === true

  // 合并 FAQ 配置，使用现有组件的数据格式
  const faqBlockData = {
    dataMode: 'direct' as const,
    directItems: faqData,
    title: faqConfig.title || "常见问题",
    subtitle: faqConfig.subtitle || "",
    showTitle: faqConfig.showTitle !== false,
    showSubtitle: faqConfig.showSubtitle === true,
    titleAlign: (faqConfig.titleAlign || "left") as "left" | "center" | "right",
    theme: (faqConfig.theme || "default") as "default" | "bordered" | "minimal",
    allowMultiple: faqConfig.allowMultiple === true,
    defaultOpenFirst: faqConfig.defaultOpenFirst === true,
    showSearch: false,
    iconType: 'chevron' as const,
    animationDuration: 300,
  }
  

  return (
    <div className="py-12">
      {/* Page content */}
      <article className="content-container mx-auto">
        {/* Title and Subtitle */}
        <header className="mb-8">
          <h1 className="text-3xl-semi mb-4 text-ui-fg-base">{page.title}</h1>
          {page.subtitle && (
            <p className="text-xl text-ui-fg-subtle">{page.subtitle}</p>
          )}
        </header>

        {/* Page content */}
        {processedContent && (
          <div
            className="prose prose-lg max-w-none dark:prose-invert
              prose-headings:text-ui-fg-base
              prose-p:text-ui-fg-base
              prose-a:text-ui-fg-interactive prose-a:no-underline hover:prose-a:underline
              prose-strong:text-ui-fg-base
              prose-code:text-ui-fg-base prose-code:bg-ui-bg-subtle prose-code:px-1 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-ui-bg-subtle prose-pre:text-ui-fg-base
              prose-img:rounded-lg prose-img:my-8
              prose-blockquote:border-l-ui-border-base prose-blockquote:text-ui-fg-subtle
              prose-ul:text-ui-fg-base prose-ol:text-ui-fg-base
              prose-li:text-ui-fg-base
              prose-hr:border-ui-border-base"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        )}
      </article>

      {/* FAQ Block */}
      {showFaq && (
        <FAQBlock data={faqBlockData} />
      )}

      {/* Contact Form */}
      {showContactForm && (
        <ContactForm 
          title={contactConfig.title}
          subtitle={contactConfig.subtitle}
          recipientEmail={contactConfig.recipientEmail}
          showTitle={contactConfig.showTitle}
          showSubtitle={contactConfig.showSubtitle}
        />
      )}

      {/* Back to home */}
      <div className="content-container mx-auto mt-12 pt-8 border-t border-ui-border-base">
        <Button
          asChild
          variant="secondary"
          className="group inline-flex items-center gap-2"
        >
          <Link href="/">
            <ChevronLeft 
              size="18" 
              className="transition-transform duration-200 ease-in-out group-hover:-translate-x-1" 
            />
            <span>Back to Home</span>
          </Link>
        </Button>
        </div>
    </div>
  )
}
