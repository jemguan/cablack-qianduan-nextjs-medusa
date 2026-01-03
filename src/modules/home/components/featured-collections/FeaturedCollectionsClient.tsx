"use client"

import { HttpTypes } from '@medusajs/types';
import { useResponsiveRender } from '@lib/hooks/useResponsiveRender';
import { Text } from '@medusajs/ui';
import LocalizedClientLink from '@modules/common/components/localized-client-link';
import { Button } from '@/components/ui/button';
import { DesktopFeaturedCollections } from './DesktopFeaturedCollections';
import { MobileFeaturedCollections } from './MobileFeaturedCollections';

interface FeaturedCollectionsClientProps {
  category: HttpTypes.StoreProductCategory;
  region: HttpTypes.StoreRegion;
  products: HttpTypes.StoreProduct[];
  title?: string;
  subtitle?: string;
  showTitle?: boolean;
  showSubtitle?: boolean;
  titleAlign?: 'left' | 'center' | 'right';
  maxCount?: number;
  desktopCols?: number;
  desktopMaxCount?: number;
  desktopEnableCarousel?: boolean;
  desktopCarouselConfig?: {
    loop?: boolean;
    autoplay?: boolean;
    autoplayDelay?: number;
    spacing?: number;
    showNavigation?: boolean;
    showPagination?: boolean;
    align?: 'start' | 'center' | 'end';
    draggable?: boolean;
  };
  mobileLayout?: 'grid' | 'carousel';
  mobileCols?: number;
  mobileCarouselConfig?: {
    slidesPerView?: number;
    spaceBetween?: number;
    showNavigation?: boolean;
    showPagination?: boolean;
    loop?: boolean;
    autoplay?: boolean;
    autoplayDelay?: number;
    align?: 'start' | 'center' | 'end';
    draggable?: boolean;
  };
  showViewAll?: boolean;
  viewAllUrl?: string;
  viewAllText?: string;
}

/**
 * 特色集合客户端组件
 * 根据设备类型自动切换桌面端和移动端布局
 */
export function FeaturedCollectionsClient({
  showViewAll = false,
  viewAllUrl,
  viewAllText = 'View All',
  title,
  subtitle,
  showTitle = true,
  showSubtitle = true,
  titleAlign = 'left',
  ...props
}: FeaturedCollectionsClientProps) {
  const { isDesktop, isHydrated } = useResponsiveRender();

  // hydration 之前返回 null，避免 SSR 渲染两个组件
  if (!isHydrated) {
    return null;
  }

  const titleAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[titleAlign];

  return (
    <>
      {((showTitle && title) || (showSubtitle && subtitle) || showViewAll) && (
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className={`flex-1 ${titleAlignClass}`}>
            {showTitle && title && (
              <Text className="txt-xlarge mb-2">{title}</Text>
            )}
            {showSubtitle && subtitle && (
              <Text className="text-medium text-ui-fg-subtle">{subtitle}</Text>
            )}
          </div>
          {showViewAll && viewAllUrl && (
            <div className="flex-shrink-0">
              <Button asChild variant="outline" size="lg" className="hidden small:inline-flex">
                <LocalizedClientLink href={viewAllUrl}>
                  {viewAllText}
                </LocalizedClientLink>
              </Button>
              <Button asChild variant="outline" size="default" className="w-full small:hidden">
                <LocalizedClientLink href={viewAllUrl}>
                  {viewAllText}
                </LocalizedClientLink>
              </Button>
            </div>
          )}
        </div>
      )}
      {isDesktop ? (
        <DesktopFeaturedCollections {...props} />
      ) : (
        <MobileFeaturedCollections {...props} />
      )}
    </>
  );
}

