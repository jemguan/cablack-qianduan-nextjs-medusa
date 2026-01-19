'use client';

import { useEffect } from 'react';
import { useProductViewTracking } from './hooks';
import type { ViewedProduct } from './types';
import type { HttpTypes } from '@medusajs/types';
import { getProductPrice } from '@lib/util/get-product-price';

interface ProductViewTrackerProps {
  /** 产品数据 */
  product: HttpTypes.StoreProduct;
}

/**
 * 产品浏览追踪组件
 * 用于自动记录用户浏览的产品到localStorage
 *
 * 使用方法：
 * <ProductViewTracker product={product} />
 */
export function ProductViewTracker({ product }: ProductViewTrackerProps) {
  const { trackProductView } = useProductViewTracking();

  useEffect(() => {
    if (!product?.id) return;

    // 获取产品价格信息
    const priceInfo = getProductPrice({ product });
    const displayPrice = priceInfo.variantPrice || priceInfo.cheapestPrice;

    // 构建浏览历史数据
    const viewedProduct: Omit<ViewedProduct, 'viewedAt'> = {
      id: product.id,
      title: product.title,
      handle: product.handle,
      vendor: undefined, // Medusa 产品可能没有 vendor 字段
      imageUrl: product.images?.[0]?.url || product.thumbnail || undefined,
      imageAlt: (product.images?.[0]?.metadata?.alt as string) || product.title,
      price: displayPrice
        ? {
            amount: displayPrice.calculated_price_number.toString(),
            currencyCode: displayPrice.currency_code,
          }
        : undefined,
      compareAtPrice:
        displayPrice && displayPrice.price_type === 'sale'
          ? {
              amount: displayPrice.original_price_number.toString(),
              currencyCode: displayPrice.currency_code,
            }
          : null,
    };

    // 追踪产品浏览（延迟1秒确保用户真正浏览了产品）
    trackProductView(viewedProduct);
  }, [product, trackProductView]);

  // 这是一个无UI组件，只负责追踪逻辑
  return null;
}

