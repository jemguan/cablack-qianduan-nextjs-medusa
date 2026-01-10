"use client"

import { useResponsiveRender } from '@lib/hooks/useResponsiveRender';
import { Text } from '@medusajs/ui';
import type { FeaturedBlogProps } from './types';
import { DesktopFeaturedBlog } from './DesktopFeaturedBlog';
import { MobileFeaturedBlog } from './MobileFeaturedBlog';

/**
 * 特色博客组件
 * 根据设备类型自动切换桌面端和移动端布局
 * 
 * 优化：只在客户端根据屏幕尺寸渲染对应组件，避免同时渲染两个组件浪费内存
 */
export function FeaturedBlog(props: FeaturedBlogProps) {
  const { isDesktop, isHydrated } = useResponsiveRender();

  // hydration 之前返回占位符，确保服务端和客户端渲染一致
  // 占位符结构需要与实际内容的结构完全匹配
  if (!isHydrated) {
    const finalClassName = props.className ? `space-y-6 ${props.className}`.trim() : "space-y-6"
    
    // 检查是否有标题配置，以决定是否渲染标题容器
    const containerData = props.containerData || {}
    const hasTitle = containerData.showTitle && containerData.title
    const hasSubtitle = containerData.showSubtitle && containerData.subtitle
    const showTitleContainer = hasTitle || hasSubtitle
    const titleAlign = containerData.titleAlign || 'left'
    const titleAlignClass = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    }[titleAlign]
    
    return (
      <div className="content-container py-8">
        <div className={finalClassName}>
          {/* 如果有标题配置，渲染标题容器占位符 */}
          {showTitleContainer && (
            <div className={titleAlignClass}>
              {hasTitle && (
                <Text className="txt-xlarge mb-2" aria-hidden="true">
                  &nbsp;
                </Text>
              )}
              {hasSubtitle && (
                <Text className="text-medium text-ui-fg-subtle" aria-hidden="true">
                  &nbsp;
                </Text>
              )}
            </div>
          )}
          {/* 内容占位符 */}
          <div className="flex items-center justify-center min-h-[300px]">
            <span className="text-muted-foreground text-sm">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // 根据屏幕尺寸只渲染对应的组件
  return (
    <div className="content-container py-8">
      {isDesktop ? (
        <DesktopFeaturedBlog {...props} />
      ) : (
        <MobileFeaturedBlog {...props} />
      )}
    </div>
  );
}

