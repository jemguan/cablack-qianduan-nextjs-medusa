/**
 * Featured Collections 组件
 * 根据配置显示单个集合的产品
 */

import { HttpTypes } from '@medusajs/types';
import { Text } from '@medusajs/ui';
import InteractiveLink from '@modules/common/components/interactive-link';
import ProductPreview from '@modules/products/components/product-preview';
import { listProducts } from '@lib/data/products';

interface FeaturedCollectionsProps {
  collection: HttpTypes.StoreCollection; // 单个集合
  region: HttpTypes.StoreRegion;
  title?: string;
  subtitle?: string;
  showTitle?: boolean;
  showSubtitle?: boolean;
  titleAlign?: 'left' | 'center' | 'right';
  maxCount?: number; // 最大显示产品数
  desktopCols?: number; // 桌面端每行显示数量
  mobileCols?: number; // 移动端每行显示数量
}

export default async function FeaturedCollections({
  collection,
  region,
  title,
  subtitle,
  showTitle = true,
  showSubtitle = true,
  titleAlign = 'left',
  maxCount = 6,
  desktopCols = 3,
  mobileCols = 2,
}: FeaturedCollectionsProps) {
  if (!collection) {
    return null;
  }

  // 获取该集合的产品
  const {
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      fields: "*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*variants.images.id,*variants.images.url,*variants.images.metadata",
    },
  });

  if (!pricedProducts || pricedProducts.length === 0) {
    return null;
  }

  // 限制显示的产品数量
  const displayProducts = pricedProducts.slice(0, maxCount);

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
      
      <div className="flex justify-between mb-8">
        <Text className="txt-xlarge">{collection.title}</Text>
        <InteractiveLink href={`/collections/${collection.handle}`}>
          View all
        </InteractiveLink>
      </div>
      
      <>
        <style dangerouslySetInnerHTML={{
          __html: `
            .featured-collections-grid {
              --mobile-cols: ${mobileCols};
              --desktop-cols: ${desktopCols};
              grid-template-columns: repeat(var(--mobile-cols), minmax(0, 1fr));
            }
            @media (min-width: 640px) {
              .featured-collections-grid {
                grid-template-columns: repeat(var(--desktop-cols), minmax(0, 1fr));
              }
            }
          `
        }} />
        <ul className="featured-collections-grid grid gap-x-6 gap-y-24 small:gap-y-36">
          {displayProducts.map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} isFeatured />
            </li>
          ))}
        </ul>
      </>
    </div>
  );
}

