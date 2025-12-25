"use client"

import { useResponsiveRender } from '@lib/hooks/useResponsiveRender';
import { Text } from '@medusajs/ui';
import type { BrandShowcaseData } from './types';
import { DesktopBrandShowcase } from './DesktopBrandShowcase';
import { MobileBrandShowcase } from './MobileBrandShowcase';
import LocalizedClientLink from '@modules/common/components/localized-client-link';
import { Button } from '@/components/ui/button';

interface BrandShowcaseProps {
  /** 品牌展示数据 */
  data: BrandShowcaseData;
}

/**
 * 品牌展示主组件
 * 根据屏幕尺寸自动切换桌面端和移动端组件
 * 
 * 优化：只在客户端根据屏幕尺寸渲染对应组件，避免同时渲染两个组件浪费内存
 */
export function BrandShowcase({ data }: BrandShowcaseProps) {
  const { isDesktop, isHydrated } = useResponsiveRender();

  // hydration 之前返回 null，避免 SSR 渲染两个组件
  if (!isHydrated) {
    return null;
  }

  // 如果 enabled 为 false，则不渲染组件
  if (data.enabled === false) {
    return null;
  }

  const {
    title,
    subtitle,
    showTitle = true,
    showSubtitle = true,
    titleAlign = 'left',
    showViewAllButton = false,
    viewAllButtonText = '查看所有品牌',
    viewAllButtonUrl = '/brands',
  } = data;

  const titleAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[titleAlign];

  return (
    <div className="content-container py-8">
      {((showTitle && title) || (showSubtitle && subtitle) || showViewAllButton) && (
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className={`flex-1 ${titleAlignClass}`}>
            {showTitle && title && (
              <Text className="txt-xlarge mb-2">{title}</Text>
            )}
            {showSubtitle && subtitle && (
              <Text className="text-medium text-ui-fg-subtle">{subtitle}</Text>
            )}
          </div>
          {showViewAllButton && (
            <div className="flex-shrink-0">
              <Button asChild variant="outline" size="lg" className="hidden small:inline-flex">
                <LocalizedClientLink href={viewAllButtonUrl}>
                  {viewAllButtonText}
                </LocalizedClientLink>
              </Button>
              <Button asChild variant="outline" size="default" className="w-full small:hidden">
                <LocalizedClientLink href={viewAllButtonUrl}>
                  {viewAllButtonText}
                </LocalizedClientLink>
              </Button>
            </div>
          )}
        </div>
      )}
      {isDesktop ? (
        <DesktopBrandShowcase data={data} />
      ) : (
        <MobileBrandShowcase data={data} />
      )}
    </div>
  );
}

