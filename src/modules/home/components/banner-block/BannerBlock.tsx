"use client"

import { useResponsiveRender } from '@lib/hooks/useResponsiveRender';
import type { BannerBlockProps } from './types';
import { DesktopBannerBlock } from './DesktopBannerBlock';
import { MobileBannerBlock } from './MobileBannerBlock';

/**
 * Banner Block 主组件
 * 根据设备类型自动切换桌面端和移动端组件
 * 支持渲染多个 banner 模块
 *
 * 优化：只在客户端根据屏幕尺寸渲染对应组件，避免同时渲染两个组件浪费内存
 */
export function BannerBlock({ data }: BannerBlockProps) {
  const { isDesktop, isHydrated } = useResponsiveRender();

  // hydration 之前返回 null，避免 SSR 渲染两个组件
  if (!isHydrated) {
    return null;
  }

  const { modules, fullWidth = false } = data;

  // 如果没有模块，不渲染
  if (!modules || modules.length === 0) {
    return null;
  }

  // 根据 fullWidth 配置决定容器样式
  // fullWidth: 全宽显示，使用负边距突破内容区域限制
  // 非 fullWidth: 使用 content-container 保持内容区域宽度
  if (isDesktop && fullWidth) {
    return (
      <div 
        className="py-4 w-screen relative left-1/2 right-1/2 -mx-[50vw]"
      >
        <DesktopBannerBlock data={data} />
      </div>
    );
  }

  return (
    <div className="content-container py-4">
      {isDesktop ? (
        <DesktopBannerBlock data={data} />
      ) : (
        <MobileBannerBlock data={data} />
      )}
    </div>
  );
}
