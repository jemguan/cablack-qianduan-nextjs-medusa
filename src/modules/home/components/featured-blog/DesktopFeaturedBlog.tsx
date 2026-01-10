"use client"

import type { FeaturedBlogProps } from './types';
import { FEATURED_BLOG_CONFIG } from './config';
import { filterArticlesByIds, limitArticles } from './utils';
import { EmblaCarousel } from '@lib/ui/embla-carousel';
import { BlogCard } from '@modules/blogs/components/blog-card';
import { Text } from '@medusajs/ui';
import LocalizedClientLink from '@modules/common/components/localized-client-link';
import { Button } from '@/components/ui/button';

/**
 * 桌面端特色博客组件
 */
export function DesktopFeaturedBlog({
  containerData,
  className = '',
  countryCode = '',
}: FeaturedBlogProps) {
  const {
    articles = [],
    articleIds,
    maxCount = FEATURED_BLOG_CONFIG.defaultMaxCount,
    showViewAll = FEATURED_BLOG_CONFIG.defaultShowViewAll,
    viewAllUrl,
    viewAllText = FEATURED_BLOG_CONFIG.defaultViewAllText,
    title,
    subtitle,
    showTitle = true,
    showSubtitle = true,
    titleAlign = 'left',
    // 桌面端配置
    desktopCols = FEATURED_BLOG_CONFIG.defaultDesktopCols,
    desktopMaxCount,
    desktopEnableCarousel = FEATURED_BLOG_CONFIG.defaultDesktopEnableCarousel,
    desktopCarouselConfig,
  } = containerData;

  // 筛选文章
  let filteredArticles = articles;
  if (articleIds && articleIds.length > 0) {
    filteredArticles = filterArticlesByIds(articles, articleIds);
  }

  // 确定是否使用轮播
  const shouldUseCarousel = desktopEnableCarousel && filteredArticles.length > (desktopMaxCount || maxCount);
  const displayCount = shouldUseCarousel ? filteredArticles.length : (desktopMaxCount || maxCount);

  // 限制文章数量
  filteredArticles = limitArticles(filteredArticles, displayCount);

  // 如果没有文章，不显示
  if (filteredArticles.length === 0) {
    return null;
  }

  const titleAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[titleAlign];

  // 生成网格类名
  const gridClasses = `grid-cols-${desktopCols}`;

  if (shouldUseCarousel) {
    // 轮播布局 - 使用 EmblaCarousel
    const finalClassName = className ? `space-y-6 ${className}`.trim() : "space-y-6"
    return (
      <div className={finalClassName}>
        {((showTitle && title) || (showSubtitle && subtitle)) && (
          <div className={`${titleAlignClass}`}>
            {showTitle && title && (
              <Text className="txt-xlarge mb-2">{title}</Text>
            )}
            {showSubtitle && subtitle && (
              <Text className="text-medium text-ui-fg-subtle">{subtitle}</Text>
            )}
          </div>
        )}
        <EmblaCarousel
          desktopSlidesPerView={desktopCols}
          mobileSlidesPerView={1}
          spacing={desktopCarouselConfig?.spacing || 24}
          showPagination={desktopCarouselConfig?.showPagination ?? true}
          showNavigation={desktopCarouselConfig?.showNavigation ?? true}
          loop={desktopCarouselConfig?.loop ?? false}
          autoplay={desktopCarouselConfig?.autoplay ?? false}
          autoplayDelay={desktopCarouselConfig?.autoplayDelay || 3000}
          align={desktopCarouselConfig?.align || 'start'}
          draggable={desktopCarouselConfig?.draggable ?? true}
        >
          {filteredArticles.map((article) => (
            <BlogCard
              key={article.id}
              post={article}
              countryCode={countryCode}
            />
          ))}
        </EmblaCarousel>

        {/* 查看全部按钮 */}
        {showViewAll && viewAllUrl && (
          <div className="flex justify-center mt-8">
            <Button asChild variant="outline" size="lg">
              <LocalizedClientLink href={viewAllUrl}>{viewAllText}</LocalizedClientLink>
            </Button>
          </div>
        )}
      </div>
    );
  }

  // 网格布局
  const finalClassName = className ? `space-y-6 ${className}`.trim() : "space-y-6"
  return (
    <div className={finalClassName}>
      {((showTitle && title) || (showSubtitle && subtitle)) && (
        <div className={`${titleAlignClass}`}>
          {showTitle && title && (
            <Text className="txt-xlarge mb-2">{title}</Text>
          )}
          {showSubtitle && subtitle && (
            <Text className="text-medium text-ui-fg-subtle">{subtitle}</Text>
          )}
        </div>
      )}
      {/* 文章网格 */}
      <div className={`grid ${gridClasses} gap-6`}>
        {filteredArticles.map((article) => (
          <BlogCard
            key={article.id}
            post={article}
            countryCode={countryCode}
          />
        ))}
      </div>

      {/* 查看全部按钮 */}
      {showViewAll && viewAllUrl && (
        <div className="flex justify-center mt-8">
          <Button asChild variant="outline" size="lg">
            <LocalizedClientLink href={viewAllUrl}>{viewAllText}</LocalizedClientLink>
          </Button>
        </div>
      )}
    </div>
  );
}

