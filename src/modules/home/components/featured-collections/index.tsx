/**
 * Featured Collections 组件
 * 根据配置显示特色集合
 */

import { HttpTypes } from '@medusajs/types';
import { Text } from '@medusajs/ui';
import InteractiveLink from '@modules/common/components/interactive-link';
import ProductRail from '../featured-products/product-rail';

interface FeaturedCollectionsProps {
  collections: HttpTypes.StoreCollection[];
  region: HttpTypes.StoreRegion;
  title?: string;
  subtitle?: string;
  showTitle?: boolean;
  showSubtitle?: boolean;
  titleAlign?: 'left' | 'center' | 'right';
}

export default function FeaturedCollections({
  collections,
  region,
  title,
  subtitle,
  showTitle = true,
  showSubtitle = true,
  titleAlign = 'left',
}: FeaturedCollectionsProps) {
  if (!collections || collections.length === 0) {
    return null;
  }

  const titleAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[titleAlign];

  return (
    <div className="content-container py-12 small:py-24">
      {(showTitle && title) || (showSubtitle && subtitle) ? (
        <div className={`mb-8 ${titleAlignClass}`}>
          {showTitle && title && (
            <Text className="txt-xlarge mb-2">{title}</Text>
          )}
          {showSubtitle && subtitle && (
            <Text className="text-medium text-ui-fg-subtle">{subtitle}</Text>
          )}
        </div>
      ) : null}
      <ul className="flex flex-col gap-x-6">
        {collections.map((collection) => (
          <li key={collection.id}>
            <ProductRail collection={collection} region={region} />
          </li>
        ))}
      </ul>
    </div>
  );
}

