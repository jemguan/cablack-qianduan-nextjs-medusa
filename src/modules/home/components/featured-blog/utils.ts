import type { BlogPost } from '@lib/data/blogs';

/**
 * 根据 ID 列表筛选文章
 */
export function filterArticlesByIds(
  articles: BlogPost[],
  articleIds: string[],
): BlogPost[] {
  if (!articleIds || articleIds.length === 0) {
    return articles;
  }

  const filtered = articles.filter((article) => {
    // 检查文章ID是否匹配
    const matches = articleIds.some((articleId) => {
      // 如果article.id是GID格式，提取最后的数字部分
      const articleIdNum = article.id.includes('/') ? article.id.split('/').pop() : article.id;
      return articleIdNum === articleId || article.id === articleId;
    });
    return matches;
  });

  return filtered;
}

/**
 * 限制文章数量
 */
export function limitArticles(
  articles: BlogPost[],
  maxCount?: number,
): BlogPost[] {
  if (!maxCount || maxCount <= 0) {
    return articles;
  }

  return articles.slice(0, maxCount);
}

/**
 * 生成网格列数类名
 */
export function generateGridColsClasses(cols?: number): string {
  if (!cols || cols <= 0) return 'grid-cols-3';
  return `grid-cols-${cols}`;
}

