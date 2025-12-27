"use client"

import { useResponsiveRender } from '@lib/hooks/useResponsiveRender';
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

  // hydration 之前返回 null，避免 SSR 渲染两个组件
  if (!isHydrated) {
    return null;
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

