/**
 * FeaturedProduct Block Handler
 * 处理精选产品块
 */

import type { HttpTypes } from '@medusajs/types';
import type { FeaturedProductData } from '../../components/featured-product/types';
import type { BlockBase, BlockConfig } from './types';
import { listProducts } from '@lib/data/products';

/**
 * 处理 FeaturedProduct Block（异步）
 */
export async function handleFeaturedProductBlock(
  block: BlockBase,
  blockConfig: Record<string, any>,
  region: HttpTypes.StoreRegion
): Promise<BlockConfig | null> {
  const productId = blockConfig.productId;

  // 如果没有配置产品 ID，返回 null（不显示）
  if (!productId) {
    return null;
  }

  // 在服务器端获取产品数据
  let product: HttpTypes.StoreProduct | null = null;
  try {
    const { response } = await listProducts({
      regionId: region.id,
      queryParams: {
        id: productId,
        fields:
          '*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*variants.images.id,*variants.images.url,*variants.images.metadata,+metadata,+tags,',
      },
    });

    product = response.products[0] || null;
  } catch (error) {
    console.error('[FeaturedProduct] Error fetching product:', error);
    product = null;
  }

  // 如果产品不存在，返回 null（不显示 block）
  if (!product) {
    return null;
  }

  // 构建 FeaturedProductData
  const featuredProductData: FeaturedProductData = {
    enabled: blockConfig.enabled !== false,
    productId,
    product,
    title: blockConfig.title || '',
    subtitle: blockConfig.subtitle || '',
    showTitle: blockConfig.showTitle !== false,
    showSubtitle: blockConfig.showSubtitle !== false,
    titleAlign: blockConfig.titleAlign || 'left',
    layout: blockConfig.layout || 'imageLeft',
    showDescription: blockConfig.showDescription !== false,
    showAllVariants: blockConfig.showAllVariants || false,
    showAllImages: blockConfig.showAllImages || false,
    showViewDetails: blockConfig.showViewDetails !== false,
    viewDetailsText: blockConfig.viewDetailsText || '查看详情',
    variantsMaxRows: blockConfig.variantsMaxRows || 2,
    variantsExpandText: blockConfig.variantsExpandText || 'Show More',
    variantsCollapseText: blockConfig.variantsCollapseText || 'Show Less',
  };

  return {
    id: `featured-product-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: 'FeaturedProduct',
    props: {
      containerData: featuredProductData,
      region,
    },
  };
}
