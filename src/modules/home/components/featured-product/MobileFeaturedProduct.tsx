"use client"

import { useState, useMemo, useEffect } from 'react';
import { isEqual } from 'lodash';
import { HttpTypes } from '@medusajs/types';
import { Text } from '@medusajs/ui';
import LocalizedClientLink from '@modules/common/components/localized-client-link';
import VariantSelector from '@modules/products/components/product-preview/variant-selector';
import QuickAddButton from '@modules/products/components/product-preview/quick-add-button';
import ProductPrice from '@modules/products/components/product-price';
import ProductImageCarousel from '@modules/products/components/product-preview/product-image-carousel';
import ProductBrandLink from '@modules/products/components/product-brand-link';
import type { FeaturedProductProps } from './types';

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant['options']
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value;
    return acc;
  }, {});
};

export function MobileFeaturedProduct({
  containerData,
  region,
  countryCode,
}: FeaturedProductProps) {
  const {
    product,
    showDescription = true,
    showAllImages = false,
    showAllVariants = false,
    showViewDetails = true,
    viewDetailsText = '查看详情',
  } = containerData;

  if (!product) {
    return null;
  }

  const [options, setOptions] = useState<Record<string, string | undefined>>({});

  // Initialize options if product has only one variant
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options);
      setOptions(variantOptions ?? {});
    }
  }, [product.variants]);

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return null;
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options);
      return isEqual(variantOptions, options);
    });
  }, [product.variants, options]);

  const handleOptionChange = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }));
  };

  // Get images for selected variant (same logic as QuickViewModal)
  const displayImages = useMemo(() => {
    const allImages = product.images || [];

    // If no variant selected, return all product images
    if (!selectedVariant || !product.variants) {
      return allImages.length > 0
        ? allImages
        : product.thumbnail
        ? [{ url: product.thumbnail }]
        : [];
    }

    // Check if variant has images
    if (!selectedVariant.images || selectedVariant.images.length === 0) {
      // No variant images, return first product image
      return allImages.length > 0
        ? [allImages[0]]
        : product.thumbnail
        ? [{ url: product.thumbnail }]
        : [];
    }

    // If variant has images, filter product images by variant image IDs
    const imageMap = new Map(allImages.map((img) => [img.id, img]));

    // Build variant images array in the order specified by variant.images
    let variantImages = selectedVariant.images
      .map((variantImg: any) => imageMap.get(variantImg.id))
      .filter((img: any) => img !== undefined);

    // Find variant-specific images (images that appear in fewer variants)
    const allVariantImageIds = new Set<string>();
    product.variants?.forEach((v) => {
      v.images?.forEach((img: any) => {
        allVariantImageIds.add(img.id);
      });
    });

    // Count how many variants each image appears in
    const imageVariantCount = new Map<string, number>();
    product.variants?.forEach((v) => {
      v.images?.forEach((img: any) => {
        const count = imageVariantCount.get(img.id) || 0;
        imageVariantCount.set(img.id, count + 1);
      });
    });

    // Find variant-specific images and common images
    const variantSpecificImages: typeof variantImages = [];
    const commonImages: typeof variantImages = [];
    const otherImages: typeof variantImages = [];

    variantImages.forEach((img) => {
      if (!img?.id) return;
      const count = imageVariantCount.get(img.id) || 0;
      const totalVariants = product.variants?.length || 1;

      if (count === 1) {
        variantSpecificImages.push(img);
      } else if (count === totalVariants) {
        commonImages.push(img);
      } else {
        otherImages.push(img);
      }
    });

    // Reorder: variant-specific first, then others maintaining original order
    variantImages = [...variantSpecificImages, ...otherImages, ...commonImages];

    // If variant has matching images, return them; otherwise return first product image
    if (variantImages.length > 0) {
      return variantImages;
    }

    // Fallback to first product image if variant has no matching images
    return allImages.length > 0
      ? [allImages[0]]
      : product.thumbnail
      ? [{ url: product.thumbnail }]
      : [];
  }, [product.images, product.thumbnail, product.variants, selectedVariant]);

  // Determine which images to show
  const imagesToShow = showAllImages
    ? displayImages
    : displayImages.slice(0, 1);

  // Build product URL (LocalizedClientLink will handle country code prefix)
  const productUrl = `/products/${product.handle}`;

  return (
    <div className="space-y-6">
      {/* 产品图片 */}
      <div>
        <ProductImageCarousel
          key={`carousel-${selectedVariant?.id || 'default'}-${imagesToShow[0]?.id || 0}`}
          images={imagesToShow}
          productTitle={product.title}
          variantId={selectedVariant?.id}
        />
      </div>

      {/* 产品信息 */}
      <div className="space-y-4">
        <div className="space-y-2">
          <ProductBrandLink productId={product.id} />
          <h1 className="text-2xl font-bold">{product.title}</h1>
        </div>

        <ProductPrice product={product} variant={selectedVariant || undefined} />

        {/* 产品选项选择器 - 由管理端的"显示所有变体选项"开关控制 */}
        {showAllVariants === true &&
          product.variants &&
          product.variants.length > 1 &&
          product.options &&
          product.options.length > 0 && (
            <div>
              <VariantSelector
                product={product}
                options={options}
                onOptionChange={handleOptionChange}
              />
            </div>
          )}

        {/* Add to Cart Button */}
        <div>
          <QuickAddButton
            product={product}
            selectedVariant={selectedVariant || undefined}
            options={options}
          />
        </div>

        {showDescription && product.description && (
          <div className="space-y-3 pt-4 border-t">
            <h2 className="text-lg font-semibold">Description</h2>
            <Text className="text-sm text-muted-foreground whitespace-pre-line">
              {product.description}
            </Text>
          </div>
        )}

        {/* 查看详情按钮 - 由管理端配置控制 */}
        {showViewDetails !== false && (
          <div className="pt-4">
            <LocalizedClientLink
              href={productUrl}
              className="block w-full text-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {viewDetailsText || '查看详情'}
            </LocalizedClientLink>
          </div>
        )}
      </div>
    </div>
  );
}

