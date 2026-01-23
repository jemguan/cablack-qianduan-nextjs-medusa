"use client";

import React, { useMemo } from 'react';
import { Button, Text } from '@medusajs/ui';
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
import { useOptionTemplateSelection } from '@modules/products/contexts/option-template-selection-context';
import { QuantitySelector } from './QuantitySelector';
import { GlassCard } from '@/lib/ui/glass-effect';
import { isEqual } from 'lodash';
import X from '@modules/common/icons/x';
import { useRouter } from 'next/navigation';
import type { LoyaltyAccount } from '@/types/loyalty';

type DesktopStickyAddToCartProps = {
  /** 产品数据 */
  product: HttpTypes.StoreProduct;
  /** 区域信息 */
  region: HttpTypes.StoreRegion;
  /** 当前选择的数量 */
  quantity: number;
  /** 数量变化回调函数 */
  onQuantityChange: (quantity: number) => void;
  /** 是否可见 */
  isVisible: boolean;
  /** 加入购物车回调函数 */
  onAddToCart: () => void;
  /** 是否正在添加 */
  isAdding: boolean;
  /** 关闭回调函数 */
  onClose: () => void;
  /** 当前登录的客户 */
  customer?: HttpTypes.StoreCustomer | null;
  /** 积分账户信息 */
  loyaltyAccount?: LoyaltyAccount | null;
  /** 会员产品 ID 列表 */
  membershipProductIds?: Record<string, boolean> | null;
  /** 选项选择是否有效 */
  isValidOptionSelections: boolean;
  /** 缺失的必选选项列表 */
  missingRequiredOptions: string[];
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
 * 桌面端粘性购物栏组件
 * 显示产品图片、变体选择、价格和加入购物车按钮
 */
export function DesktopStickyAddToCart({
  product,
  quantity,
  onQuantityChange,
  isVisible,
  onAddToCart,
  isAdding,
  onClose,
  customer,
  loyaltyAccount,
  membershipProductIds,
  isValidOptionSelections,
  missingRequiredOptions,
}: DesktopStickyAddToCartProps) {
  const { options, selectedVariant, setOptionValue } = useVariantSelection();
  const router = useRouter();

  // 检查当前产品是否是会员产品
  const isMembershipProduct = useMemo(() => {
    if (!membershipProductIds || !product.id) return false;
    return membershipProductIds[product.id] === true;
  }, [membershipProductIds, product.id]);

  // 检查用户是否是 VIP
  const isVip = useMemo(() => {
    if (!loyaltyAccount) return false;
    if (!loyaltyAccount.is_member) return false;
    if (!loyaltyAccount.membership_expires_at) return false;
    return new Date(loyaltyAccount.membership_expires_at) > new Date();
  }, [loyaltyAccount]);

  // 检查用户是否已登录
  const isLoggedIn = !!customer;

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

  return (
    <GlassCard
      className="border-t border-ui-border-base shadow-lg"
      enabled={true}
      opacity={0.85}
      blur="md"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-ui-fg-muted hover:text-ui-fg-base transition-colors rounded-full hover:bg-ui-bg-subtle-hover"
            aria-label="Close sticky cart"
            data-testid="close-sticky-cart-button"
          >
            <X size={16} />
          </button>

          {/* 产品图片 */}
          {productImage && (
            <div className="flex-shrink-0">
              <img
                src={productImage}
                alt={product.title}
                className="w-16 h-16 object-cover rounded-md border border-ui-border-base"
              />
            </div>
          )}

          {/* 产品标题 */}
          <div className="flex-shrink-0 min-w-0 max-w-[160px]">
            <h3 className="text-sm font-semibold text-ui-fg-base truncate">
              {product.title}
            </h3>
            {selectedVariant &&
              selectedVariant.title !== 'Default Title' &&
              selectedVariant.title && (
                <p className="text-xs text-ui-fg-subtle truncate">
                  {selectedVariant.title}
                </p>
              )}
          </div>

          {/* 变体选择器 - 下拉式 */}
          {(product.variants?.length || 0) > 1 &&
            product.options &&
            product.options.length > 0 && (
              <div className="flex-1 min-w-0 flex items-center gap-2">
                {product.options.map((option) => {
                const currentValue = options[option.id];
                const optionValues = (option.values || []).map((v) => v.value);

                return (
                  <div
                    key={option.id}
                    className="flex items-center gap-2 min-w-[140px]"
                  >
                    <span className="text-xs text-ui-fg-subtle whitespace-nowrap">
                      {option.title}:
                    </span>
                    <Select
                      value={currentValue || ''}
                      onValueChange={(value: string) => {
                        setOptionValue(option.id, value);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder={`Select ${option.title}`} />
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

          {/* 价格 */}
          <div className="flex-shrink-0">
            <div className="text-right">
              {displayPrice ? (
                <>
                  <p className="text-lg font-bold text-ui-fg-base">
                    {displayPrice.calculated_price}
                  </p>
                  {displayPrice.price_type === 'sale' &&
                    displayPrice.original_price_number >
                      displayPrice.calculated_price_number && (
                      <p className="text-sm text-ui-fg-muted line-through">
                        {displayPrice.original_price}
                      </p>
                    )}
                </>
              ) : (
                <p className="text-lg font-bold text-ui-fg-base">N/A</p>
              )}
            </div>
          </div>

          {/* 数量选择器 */}
          <div className="flex-shrink-0">
            <QuantitySelector
              quantity={quantity}
              onQuantityChange={onQuantityChange}
              minQuantity={1}
              maxQuantity={99}
              size="sm"
              showLabel={false}
            />
          </div>

          {/* 加入购物车按钮 */}
          <div className="flex-shrink-0">
            {/* 会员产品特殊按钮处理 */}
            {isMembershipProduct ? (
              !isLoggedIn ? (
                // 未登录：显示绿色 "Need login to buy" 按钮
                <Button
                  onClick={() => router.push("/account")}
                  variant="primary"
                  className="h-8 px-4 text-white border-none !border-2 !shadow-none bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 !border-green-600 hover:!border-green-700 dark:!border-green-600 dark:hover:!border-green-700"
                  style={{ borderColor: 'rgb(22 163 74)', borderWidth: '2px', borderStyle: 'solid' }}
                >
                  Need login to buy
                </Button>
              ) : isVip ? (
                // VIP 用户：显示禁用按钮
                <Button
                  disabled
                  variant="primary"
                  className="h-8 px-4 text-white border-none !border-2 !shadow-none bg-ui-bg-disabled hover:bg-ui-bg-disabled dark:bg-ui-bg-disabled dark:hover:bg-ui-bg-disabled !border-ui-border-base cursor-not-allowed"
                  style={{ borderColor: 'rgb(229 231 235)', borderWidth: '2px', borderStyle: 'solid' }}
                >
                  You are already a VIP
                </Button>
              ) : (
                // 普通用户：正常添加到购物车
                <Button
                  onClick={onAddToCart}
                  disabled={
                    !inStock ||
                    !selectedVariant ||
                    isAdding ||
                    !isValidVariant ||
                    !isValidOptionSelections
                  }
                  variant="primary"
                  className={`h-8 px-4 text-white border-none !border-2 !shadow-none ${
                    !inStock || !isValidVariant || !selectedVariant || !isValidOptionSelections
                      ? "bg-ui-bg-disabled hover:bg-ui-bg-disabled dark:bg-ui-bg-disabled dark:hover:bg-ui-bg-disabled !border-ui-border-base cursor-not-allowed"
                      : "bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 !border-orange-600 hover:!border-orange-700 dark:!border-orange-600 dark:hover:!border-orange-700"
                  }`}
                  style={
                    !inStock || !isValidVariant || !selectedVariant || !isValidOptionSelections
                      ? { borderColor: 'rgb(229 231 235)', borderWidth: '2px', borderStyle: 'solid' }
                      : { borderColor: 'rgb(234 88 12)', borderWidth: '2px', borderStyle: 'solid' }
                  }
                  isLoading={isAdding}
                >
                  {!selectedVariant || !isValidVariant
                    ? 'Select variant'
                    : !inStock
                    ? 'Out of Stock'
                    : !isValidOptionSelections
                    ? 'Select Options'
                    : 'Add to Cart'}
                </Button>
              )
            ) : (
              // 非会员产品：正常按钮
              <Button
                onClick={onAddToCart}
                disabled={
                  !inStock ||
                  !selectedVariant ||
                  isAdding ||
                  !isValidVariant ||
                  !isValidOptionSelections
                }
                variant="primary"
                className={`h-8 px-4 text-white border-none !border-2 !shadow-none ${
                  !inStock || !isValidVariant || !selectedVariant || !isValidOptionSelections
                    ? "bg-ui-bg-disabled hover:bg-ui-bg-disabled dark:bg-ui-bg-disabled dark:hover:bg-ui-bg-disabled !border-ui-border-base cursor-not-allowed"
                    : "bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 !border-orange-600 hover:!border-orange-700 dark:!border-orange-600 dark:hover:!border-orange-700"
                }`}
                style={
                  !inStock || !isValidVariant || !selectedVariant || !isValidOptionSelections
                    ? { borderColor: 'rgb(229 231 235)', borderWidth: '2px', borderStyle: 'solid' }
                    : { borderColor: 'rgb(234 88 12)', borderWidth: '2px', borderStyle: 'solid' }
                }
                isLoading={isAdding}
              >
                {!selectedVariant || !isValidVariant
                  ? 'Select variant'
                  : !inStock
                  ? 'Out of Stock'
                  : !isValidOptionSelections
                  ? 'Select Options'
                  : 'Add to Cart'}
              </Button>
            )}
          </div>

          {/* 必选选项错误提示 - 桌面端详细版，与产品详情页一致 */}
          {!isValidOptionSelections && missingRequiredOptions.length > 0 && (
            <div className="flex-shrink-0 ml-2 p-2 rounded bg-ui-bg-subtle border border-ui-border-base">
              <Text className="text-xs text-ui-fg-error font-medium">
                Please select the following options:
              </Text>
              <ul className="mt-1 text-xs text-ui-fg-subtle list-disc list-inside">
                {missingRequiredOptions.map((option, index) => (
                  <li key={index}>{option}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

