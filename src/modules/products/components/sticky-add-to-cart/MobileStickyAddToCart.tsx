"use client";

import React, { useMemo } from 'react';
import { Button } from '@medusajs/ui';
import { HttpTypes } from '@medusajs/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getProductPrice } from '@lib/util/get-product-price';
import { getImageUrl } from '@lib/util/image';
import { useVariantSelection } from '@modules/products/contexts/variant-selection-context';
import { GlassCard } from '@/lib/ui/glass-effect';
import { isEqual } from 'lodash';

type MobileStickyAddToCartProps = {
  /** 产品数据 */
  product: HttpTypes.StoreProduct;
  /** 区域信息 */
  region: HttpTypes.StoreRegion;
  /** 当前选择的数量 */
  quantity: number;
  /** 是否可见 */
  isVisible: boolean;
  /** 加入购物车回调函数 */
  onAddToCart: () => void;
  /** 是否正在添加 */
  isAdding: boolean;
};

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant['options'],
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value;
    return acc;
  }, {});
};

/**
 * 移动端粘性购物栏组件
 * 显示图片、变体选择、价格和加入购物车按钮
 */
export function MobileStickyAddToCart({
  product,
  quantity,
  isVisible,
  onAddToCart,
  isAdding,
}: MobileStickyAddToCartProps) {
  const { options, selectedVariant, setOptionValue } = useVariantSelection();

  // 检查选中的变体是否有效
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options);
      return isEqual(variantOptions, options);
    });
  }, [product.variants, options]);

  // 检查变体是否有库存
  const inStock = useMemo(() => {
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true;
    }
    if (selectedVariant?.allow_backorder) {
      return true;
    }
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true;
    }
    return false;
  }, [selectedVariant]);

  // 获取价格信息
  const priceInfo = useMemo(() => {
    return getProductPrice({
      product,
      variantId: selectedVariant?.id,
    });
  }, [product, selectedVariant]);

  const displayPrice = selectedVariant
    ? priceInfo.variantPrice
    : priceInfo.cheapestPrice;

  // 获取产品图片
  const productImage = useMemo(() => {
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
      return getImageUrl(selectedVariant.images[0].url);
    }
    if (product.images && product.images.length > 0) {
      return getImageUrl(product.images[0].url);
    }
    if (product.thumbnail) {
      return getImageUrl(product.thumbnail);
    }
    return null;
  }, [product, selectedVariant]);

  // 检查选项值是否可用
  const isOptionValueAvailable = (
    optionId: string,
    value: string,
  ): boolean => {
    const isVariantInStock = (variant: HttpTypes.StoreProductVariant): boolean => {
      if (variant.manage_inventory === false) return true;
      if (variant.allow_backorder === true) return true;
      return (variant.inventory_quantity || 0) > 0;
    };

    const availableVariants =
      product.variants?.filter((v) => {
        const variantOptions = optionsAsKeymap(v.options);
        return variantOptions?.[optionId] === value;
      }) || [];

    return availableVariants.some((v) => isVariantInStock(v));
  };

  const hasMultipleVariants = (product.variants?.length || 0) > 1;

  return (
    <GlassCard
      className="border-t border-ui-border-base shadow-lg"
      enabled={true}
      opacity={0.85}
      blur="md"
    >
      <div className="px-4 py-3 space-y-3">
        {/* 第一行：图片、标题、价格 */}
        <div className="flex items-center gap-3">
          {/* 产品图片 */}
          {productImage && (
            <div className="flex-shrink-0">
              <img
                src={productImage}
                alt={product.title}
                className="w-12 h-12 object-cover rounded-md border border-ui-border-base"
              />
            </div>
          )}

          {/* 产品信息 */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-ui-fg-base truncate">
              {product.title}
            </h3>
            <div className="flex items-baseline gap-2 mt-1">
              {displayPrice ? (
                <>
                  <p className="text-base font-bold text-ui-fg-base">
                    {displayPrice.calculated_price}
                  </p>
                  {displayPrice.price_type === 'sale' &&
                    displayPrice.original_price_number >
                      displayPrice.calculated_price_number && (
                      <p className="text-xs text-ui-fg-muted line-through">
                        {displayPrice.original_price}
                      </p>
                    )}
                </>
              ) : (
                <p className="text-base font-bold text-ui-fg-base">N/A</p>
              )}
            </div>
          </div>
        </div>

        {/* 第二行：变体选择器 */}
        {hasMultipleVariants && product.options && product.options.length > 0 && (
          <div className="flex gap-2">
            {product.options.map((option) => {
              const currentValue = options[option.id];
              const optionValues = (option.values || []).map((v) => v.value);

              return (
                <div key={option.id} className="flex-1">
                  <Select
                    value={currentValue || ''}
                    onValueChange={(value: string) => {
                      setOptionValue(option.id, value);
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder={option.title} />
                    </SelectTrigger>
                    <SelectContent>
                      {optionValues.map((value) => {
                        const isAvailable = isOptionValueAvailable(
                          option.id,
                          value,
                        );
                        return (
                          <SelectItem
                            key={value}
                            value={value}
                            disabled={!isAvailable}
                          >
                            <span className="text-xs">{value}</span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        )}

        {/* 第三行：加入购物车按钮 */}
        <div className="flex-1">
          <Button
            onClick={onAddToCart}
            disabled={
              !inStock ||
              !selectedVariant ||
              isAdding ||
              !isValidVariant
            }
            variant="primary"
            className="w-full h-10"
            isLoading={isAdding}
          >
            {!selectedVariant || !isValidVariant
              ? 'Select variant'
              : !inStock
              ? 'Out of stock'
              : 'Add to cart'}
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}

