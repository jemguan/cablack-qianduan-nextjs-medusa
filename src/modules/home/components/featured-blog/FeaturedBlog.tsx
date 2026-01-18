import type { FeaturedBlogProps } from './types';
import { DesktopFeaturedBlog } from './DesktopFeaturedBlog';
import { MobileFeaturedBlog } from './MobileFeaturedBlog';

/**
 * 特色博客组件
 * 使用 CSS 媒体查询切换桌面端和移动端布局
 * 
 * 注意：为了避免 hydration 错误，我们同时渲染两个版本，
 * 使用 CSS 的 hidden/block 类来控制显示，这样服务端和客户端渲染一致
 */
export function FeaturedBlog(props: FeaturedBlogProps) {
  return (
    <div className="content-container py-8">
      {/* 桌面端版本 - 在 small (768px) 及以上显示 */}
      <div className="hidden small:block">
        <DesktopFeaturedBlog {...props} />
      </div>
      {/* 移动端版本 - 在 small (768px) 以下显示 */}
      <div className="block small:hidden">
        <MobileFeaturedBlog {...props} />
      </div>
    </div>
  );
}

