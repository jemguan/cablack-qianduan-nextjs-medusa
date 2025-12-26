import type { FAQItem } from './types';

/**
 * 从产品 metadata JSON 解析 FAQ 数据
 */
export function parseFAQMetadata(
  metadataValue: string | null | undefined,
): FAQItem[] {
  if (!metadataValue) {
    return [];
  }

  try {
    const parsed: any = JSON.parse(metadataValue);

    // 支持两种格式：
    // 1. 直接是 FAQ 数组
    // 2. 包含 items 属性的对象
    if (Array.isArray(parsed)) {
      // 确保每个 item 都有 id
      return parsed.map((item, index) => ({
        ...item,
        id: item.id || `faq-item-${index}`,
      })) as FAQItem[];
    }

    if (parsed.items && Array.isArray(parsed.items)) {
      return parsed.items.map((item: any, index: number) => ({
        ...item,
        id: item.id || `faq-item-${index}`,
      })) as FAQItem[];
    }

    return [];
  } catch (error) {
    console.error('Failed to parse FAQ metadata:', error);
    return [];
  }
}

/**
 * 搜索过滤 FAQ 项
 */
export function filterFAQItems(
  items: FAQItem[],
  searchQuery: string,
): FAQItem[] {
  if (!searchQuery.trim()) {
    return items;
  }

  const query = searchQuery.toLowerCase();

  return items.filter((item) => {
    const questionMatch = item.question.toLowerCase().includes(query);
    const answerMatch = item.answer.toLowerCase().includes(query);
    return questionMatch || answerMatch;
  });
}

/**
 * 清理 HTML 标签，只保留纯文本
 * Google 富媒体测试要求答案是纯文本或简单 HTML
 */
function stripHtmlTags(html: string): string {
  // 移除 HTML 标签，但保留内容
  return html
    .replace(/<br\s*\/?>/gi, '\n') // 将 <br> 转换为换行
    .replace(/<\/p>/gi, '\n\n') // 将 </p> 转换为双换行
    .replace(/<[^>]+>/g, '') // 移除所有其他 HTML 标签
    .replace(/\n{3,}/g, '\n\n') // 将多个换行合并为最多两个
    .trim();
}

/**
 * 生成 FAQ 结构化数据（Schema.org）
 * 符合 Google 富媒体搜索要求
 */
export function generateFAQSchema(items: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: stripHtmlTags(item.answer),
      },
    })),
  };
}

