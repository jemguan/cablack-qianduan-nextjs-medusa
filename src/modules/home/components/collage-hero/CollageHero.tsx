"use client"

import {useResponsiveRender} from '@lib/hooks/useResponsiveRender';
import {DesktopCollageHero} from './DesktopCollageHero';
import {MobileCollageHero} from './MobileCollageHero';
import type {CollageHeroBlockProps} from './types';
import type {HttpTypes} from '@medusajs/types';

/**
 * CollageHero Block 组件
 * 
 * 功能特性：
 * - 全屏背景图片（桌面端和移动端可设置不同图片）
 * - 向下滚动时背景图片层级变低（z-index 可配置）
 * - 支持5种模块类型：
 *   1. 图片模块（点击后跳转到不同页面）
 *   2. 产品系列模块（点击后跳转到对应的产品系列页面）
 *   3. 视频模块（可以自动播放视频）
 *   4. 主推产品模块
 *   5. 文字模块
 * 
 * 优化：只在客户端根据屏幕尺寸渲染对应组件，避免同时渲染两个组件浪费内存
 */
export function CollageHero({
  containerData,
  className,
  region,
}: CollageHeroBlockProps & {region?: HttpTypes.StoreRegion}) {
  // 如果 enabled 为 false，则不渲染组件
  if (containerData.enabled === false) {
    return null;
  }

  const {isDesktop, isHydrated} = useResponsiveRender();

  // hydration 之前返回占位符，避免 SSR 渲染两个组件
  if (!isHydrated) {
    return <div className="relative w-full min-h-screen" aria-hidden="true" />;
  }

  // 根据屏幕尺寸只渲染对应的组件
  return isDesktop ? (
    <DesktopCollageHero containerData={containerData} className={className} region={region} />
  ) : (
    <MobileCollageHero containerData={containerData} className={className} region={region} />
  );
}

