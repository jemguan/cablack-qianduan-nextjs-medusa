"use client"

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
 * 使用 CSS 媒体查询控制显示/隐藏，避免 Hydration 不匹配问题
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

  // 使用 CSS 媒体查询控制显示/隐藏，避免 Hydration 不匹配
  return (
    <>
      <div className="hidden small:block">
        <DesktopCollageHero containerData={containerData} className={className} region={region} />
      </div>
      <div className="block small:hidden">
        <MobileCollageHero containerData={containerData} className={className} region={region} />
      </div>
    </>
  );
}

