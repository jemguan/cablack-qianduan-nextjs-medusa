"use client"

import type { FeaturedBlogProps } from './types';
import { FEATURED_BLOG_CONFIG } from './config';
import { filterArticlesByIds, limitArticles } from './utils';
import { EmblaCarousel } from '@lib/ui/embla-carousel';
import { BlogCard } from '@modules/blogs/components/blog-card';
import LocalizedClientLink from '@modules/common/components/localized-client-link';
import { Button } from '@/components/ui/button';

/**
 * 移动端特色博客组件
 * 使用 EmblaCarousel 进行轮播展示
 */
export function MobileFeaturedBlog({
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
    // 移动端配置
    mobileLayout = FEATURED_BLOG_CONFIG.defaultMobileLayout,
    mobileCols = FEATURED_BLOG_CONFIG.defaultMobileCols,
    mobileCarouselConfig,
  } = containerData;

  // 筛选和限制文章
  let filteredArticles = articles;
  if (articleIds && articleIds.length > 0) {
    filteredArticles = filterArticlesByIds(articles, articleIds);
  }
  filteredArticles = limitArticles(filteredArticles, maxCount);

  // 如果没有文章，不显示
  if (filteredArticles.length === 0) {
    return null;
  }

  const titleAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[titleAlign];

  if (mobileLayout === 'grid') {
    // 网格布局
    const gridClasses = `grid-cols-${mobileCols}`;

    return (
      <div className={`space-y-6 ${className}`}>
        {((showTitle && title) || (showSubtitle && subtitle)) && (
          <div className={`${titleAlignClass}`}>
            {showTitle && title && (
              <p className="txt-xlarge mb-2 font-normal font-sans">{title}</p>
            )}
            {showSubtitle && subtitle && (
              <p className="text-medium text-ui-fg-subtle font-normal font-sans">{subtitle}</p>
            )}
          </div>
        )}
        {/* 文章网格 */}
        <div className={`grid ${gridClasses} gap-4`}>
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
          <div className="flex justify-center mt-6">
            <Button asChild variant="outline" size="default" className="w-full">
              <LocalizedClientLink href={viewAllUrl}>{viewAllText}</LocalizedClientLink>
            </Button>
          </div>
        )}
      </div>
    );
  }

  // 轮播布局
  return (
    <div className={`space-y-6 ${className}`}>
      {((showTitle && title) || (showSubtitle && subtitle)) && (
        <div className={`${titleAlignClass}`}>
          {showTitle && title && (
            <p className="txt-xlarge mb-2 font-normal font-sans">{title}</p>
          )}
          {showSubtitle && subtitle && (
            <p className="text-medium text-ui-fg-subtle font-normal font-sans">{subtitle}</p>
          )}
        </div>
      )}
      {/* 文章轮播 */}
      <EmblaCarousel
        mobileSlidesPerView={mobileCarouselConfig?.slidesPerView || 1.5}
        desktopSlidesPerView={3}
        spacing={mobileCarouselConfig?.spaceBetween || 16}
        showPagination={mobileCarouselConfig?.showPagination !== false}
        showNavigation={mobileCarouselConfig?.showNavigation || false}
        loop={mobileCarouselConfig?.loop || false}
        autoplay={mobileCarouselConfig?.autoplay || false}
        autoplayDelay={mobileCarouselConfig?.autoplayDelay || 3000}
        align={mobileCarouselConfig?.align || 'start'}
        draggable={mobileCarouselConfig?.draggable ?? true}
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
        <div className="flex justify-center mt-6">
          <Button asChild variant="outline" size="default" className="w-full">
            <LocalizedClientLink href={viewAllUrl}>{viewAllText}</LocalizedClientLink>
          </Button>
        </div>
      )}
    </div>
  );
}

