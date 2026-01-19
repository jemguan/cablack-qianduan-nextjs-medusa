/**
 * FeaturedProduct Block 组件
 * 展示单个特色产品的详细信息
 */

import { listProducts } from '@lib/data/products';
import { HttpTypes } from '@medusajs/types';
import { FeaturedProductClient } from './FeaturedProductClient';
import type { FeaturedProductData } from './types';

interface FeaturedProductProps {
  containerData: FeaturedProductData;
  region: HttpTypes.StoreRegion;
  countryCode?: string;
  className?: string;
}

export default async function FeaturedProduct({
  containerData,
  region,
  countryCode,
  className,
}: FeaturedProductProps) {
  const { productId, product } = containerData;

  // 如果已经有产品数据，直接使用
  let productData = product;

  // 如果没有产品数据，通过 productId 获取
  if (!productData && productId) {
    try {
      const { response } = await listProducts({
        regionId: region.id,
        queryParams: {
          id: productId,
          fields:
            '*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*variants.images.id,*variants.images.url,*variants.images.metadata,+metadata,+tags,',
        },
      });

      productData = response.products[0] || undefined;
    } catch (error) {
      console.error('[FeaturedProduct] Error fetching product:', error);
      productData = undefined;
    }
  }

  // 如果产品不存在，不显示 block
  if (!productData) {
    return null;
  }

  // 构建包含产品数据的 containerData
  const dataWithProduct: FeaturedProductData = {
    ...containerData,
    product: productData,
  };

  return (
    <div className={`content-container py-12 small:py-24 ${className || ''}`}>
      {/* 标题和副标题 */}
      {(containerData.showTitle !== false || containerData.showSubtitle !== false) &&
        ((containerData.title && containerData.showTitle !== false) ||
          (containerData.subtitle && containerData.showSubtitle !== false)) && (
          <div
            className={`mb-6 ${
              containerData.titleAlign === 'center'
                ? 'text-center'
                : containerData.titleAlign === 'right'
                ? 'text-right'
                : 'text-left'
            }`}
          >
            {containerData.title && containerData.showTitle !== false && (
              <h2 className="txt-xlarge mb-2">{containerData.title}</h2>
            )}
            {containerData.subtitle && containerData.showSubtitle !== false && (
              <p className="text-medium text-ui-fg-subtle">{containerData.subtitle}</p>
            )}
          </div>
        )}

      {/* 产品内容 */}
      <FeaturedProductClient
        containerData={dataWithProduct}
        region={region}
        countryCode={countryCode}
        className={className}
      />
    </div>
  );
}

