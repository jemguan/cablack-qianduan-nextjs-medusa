"use client"

import { useResponsiveRender } from '@lib/hooks/useResponsiveRender';
import { DesktopFeaturedProduct } from './DesktopFeaturedProduct';
import { MobileFeaturedProduct } from './MobileFeaturedProduct';
import type { FeaturedProductProps } from './types';

/**
 * 特色产品客户端组件
 * 根据设备类型自动切换桌面端和移动端布局
 */
export function FeaturedProductClient(props: FeaturedProductProps) {
  const { isDesktop, isHydrated } = useResponsiveRender();

  // hydration 之前返回 null，避免 SSR 渲染两个组件
  if (!isHydrated) {
    return null;
  }

  // 根据屏幕尺寸只渲染对应的组件
  return isDesktop ? (
    <DesktopFeaturedProduct {...props} />
  ) : (
    <MobileFeaturedProduct {...props} />
  );
}

