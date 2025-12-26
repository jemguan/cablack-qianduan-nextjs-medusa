"use client"

import { useResponsiveRender } from '@lib/hooks/useResponsiveRender';
import { Text } from '@medusajs/ui';
import type { TextBlockProps } from './types';
import { DesktopTextBlock } from './DesktopTextBlock';
import { MobileTextBlock } from './MobileTextBlock';
import { DEFAULT_TEXT_BLOCK_DATA } from './config';

/**
 * 文字 Block 主组件
 * 根据设备类型自动切换桌面端和移动端组件
 * 支持渲染多个文字模块
 *
 * 优化：只在客户端根据屏幕尺寸渲染对应组件，避免同时渲染两个组件浪费内存
 */
export function TextBlock({ data }: TextBlockProps) {
  const { isDesktop, isHydrated } = useResponsiveRender();

  // hydration 之前返回 null，避免 SSR 渲染两个组件
  if (!isHydrated) {
    return null;
  }

  const {
    title,
    subtitle,
    showTitle = DEFAULT_TEXT_BLOCK_DATA.showTitle ?? true,
    showSubtitle = DEFAULT_TEXT_BLOCK_DATA.showSubtitle ?? true,
    titleAlign = DEFAULT_TEXT_BLOCK_DATA.titleAlign ?? 'left',
    modules,
  } = data;

  // 如果没有模块，不渲染
  if (!modules || modules.length === 0) {
    return null;
  }

  const titleAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[titleAlign];

  return (
    <div className="content-container py-8">
      {((showTitle && title) || (showSubtitle && subtitle)) && (
        <div className={`mb-6 ${titleAlignClass}`}>
          {showTitle && title && (
            <Text className="txt-xlarge mb-2">{title}</Text>
          )}
          {showSubtitle && subtitle && (
            <Text className="text-medium text-ui-fg-subtle">{subtitle}</Text>
          )}
        </div>
      )}
      {isDesktop ? (
        <DesktopTextBlock data={data} />
      ) : (
        <MobileTextBlock data={data} />
      )}
    </div>
  );
}

