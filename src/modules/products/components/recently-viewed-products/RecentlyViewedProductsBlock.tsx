'use client';

import { useRef } from 'react';
import { useIntersection } from '@lib/hooks/use-in-view';
import { useResponsiveRender } from '@lib/hooks/useResponsiveRender';
import { validateProductLimit } from './utils';
import { useRecentlyViewedProducts } from './hooks';
import {
  DEFAULT_RECENTLY_VIEWED_BLOCK_CONFIG,
  PERFORMANCE_CONFIG,
} from './config';
import type { RecentlyViewedProductsBlockProps } from './types';
import { DesktopRecentlyViewedProducts } from './DesktopRecentlyViewedProducts';
import { MobileRecentlyViewedProducts } from './MobileRecentlyViewedProducts';
import { Text } from '@medusajs/ui';

/**
 * 最近浏览产品 Block 组件
 * 用于在产品页面展示最近浏览的产品
 *
 * 功能特点：
 * - 可通过配置文件完全自定义
 * - 基于localStorage存储浏览历史
 * - 自动排除当前产品
 * - 响应式设计（桌面端和移动端分离）
 * - 智能布局选择（桌面端）
 * - 移动端 Coverflow 效果（轮播模式）
 * - 性能优化的视口检测
 *
 * 优化：只在客户端根据屏幕尺寸渲染对应组件，避免同时渲染两个组件浪费内存
 */
export function RecentlyViewedProductsBlock({
  data,
  region,
  countryCode,
}: RecentlyViewedProductsBlockProps) {
  // 合并默认配置和传入的配置
  const config = {
    ...DEFAULT_RECENTLY_VIEWED_BLOCK_CONFIG,
    ...data,
  };

  // 如果禁用，不显示组件
  if (config.enabled === false) {
    return null;
  }

  // 视口检测 - 性能优化：只有在视口内才加载组件
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useIntersection(ref, PERFORMANCE_CONFIG.rootMargin);

  const { isDesktop, isHydrated } = useResponsiveRender();

  // 验证并限制产品数量
  const validatedLimit = validateProductLimit(config.limit || 8);

  // 获取最近浏览的产品（需要传入 countryCode 和 region.id 以从服务器获取完整数据）
  const { products, loading } = useRecentlyViewedProducts(
    validatedLimit,
    config.currentProductId,
    countryCode,
    region.id,
  );

  // 如果没有浏览历史或正在加载，不显示组件
  if (!isVisible || loading || !products.length) {
    return <div ref={ref} />;
  }

  // hydration 之前返回占位符，避免 SSR 渲染两个组件
  if (!isHydrated) {
    return <div ref={ref} aria-hidden="true" />;
  }

  // 标题和副标题
  const showTitle = config.showTitle !== false && config.title;
  const showSubtitle = config.showSubtitle !== false && config.subtitle;
  const titleAlign = config.titleAlign || 'left';

  return (
    <div ref={ref} className="content-container my-16 small:my-32">
      {/* 标题区域 */}
      {(showTitle || showSubtitle) && (
        <div
          className={`mb-8 ${
            titleAlign === 'center'
              ? 'text-center'
              : titleAlign === 'right'
              ? 'text-right'
              : 'text-left'
          }`}
        >
          {showTitle && (
            <Text className="txt-xlarge mb-2">{config.title}</Text>
          )}
          {showSubtitle && (
            <Text className="txt-small text-muted-foreground">
              {config.subtitle}
            </Text>
          )}
        </div>
      )}

      {/* 产品展示区域 */}
      {isDesktop ? (
        <DesktopRecentlyViewedProducts
          products={products}
          region={region}
          config={config}
        />
      ) : (
        <MobileRecentlyViewedProducts
          products={products}
          region={region}
          config={config}
        />
      )}
    </div>
  );
}

