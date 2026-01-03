'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ViewedProduct } from './types';
import {
  getRecentlyViewedProducts,
  addProductToHistory,
  clearViewingHistory,
} from './utils';
import type { HttpTypes } from '@medusajs/types';

/**
 * 最近浏览产品的Hook
 * 通过产品ID从服务器获取完整的产品数据（包括所有变体）
 */
export function useRecentlyViewedProducts(
  limit: number = 8,
  excludeProductId?: string,
  countryCode?: string,
  regionId?: string,
) {
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载最近浏览的产品
  const loadProducts = useCallback(async () => {
    if (!countryCode && !regionId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 从 localStorage 获取产品ID列表
      const viewedProducts = getRecentlyViewedProducts(
        limit,
        excludeProductId,
      );

      if (viewedProducts.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // 提取产品ID列表
      const productIds = viewedProducts.map((p) => p.id);

      // 使用 Next.js API 代理路由获取产品数据，避免 CORS 问题
      const params = new URLSearchParams();
      productIds.forEach((id) => params.append('id', id));
      if (regionId) {
        params.append('region_id', regionId);
      }
      params.append('fields', '*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*variants.inventory_items.inventory_item_id,*variants.inventory_items.required_quantity,*variants.images.id,*variants.images.url,*variants.images.metadata,*variants.options.option_id,*variants.options.value,*options.id,*options.title,*options.values.id,*options.values.value,+metadata,+tags,');

      const response = await fetch(`/api/medusa-proxy/products?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json() as {
        products: HttpTypes.StoreProduct[];
        count: number;
      };

      // 按照浏览顺序排序（保持 localStorage 中的顺序）
      const productMap = new Map(
        (data.products || []).map((p) => [p.id, p]),
      );
      const orderedProducts = viewedProducts
        .map((viewed) => productMap.get(viewed.id))
        .filter((p): p is HttpTypes.StoreProduct => p !== undefined);

      setProducts(orderedProducts);
    } catch (error) {
      console.warn('加载最近浏览产品失败:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [limit, excludeProductId, countryCode, regionId]);

  // 添加产品到浏览历史
  const addProduct = useCallback(
    (product: Omit<ViewedProduct, 'viewedAt'>) => {
      addProductToHistory(product);
      // 重新加载产品列表
      loadProducts();
    },
    [loadProducts],
  );

  // 清空浏览历史
  const clearHistory = useCallback(() => {
    clearViewingHistory();
    setProducts([]);
  }, []);

  // 初始加载
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // 监听localStorage变化（其他标签页的更新）
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'medusa_recently_viewed_products') {
        loadProducts();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadProducts]);

  return {
    products,
    loading,
    addProduct,
    clearHistory,
    refresh: loadProducts,
  };
}

/**
 * 产品浏览追踪Hook
 * 用于在产品页面自动记录浏览历史
 */
export function useProductViewTracking() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trackProductView = useCallback(
    (product: Omit<ViewedProduct, 'viewedAt'>) => {
      // 清除之前的定时器（如果存在）
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // 延迟添加，确保用户真正浏览了产品
      timerRef.current = setTimeout(() => {
        addProductToHistory(product);
        timerRef.current = null;
      }, 1000); // 1秒后记录浏览
    },
    [],
  );

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return { trackProductView };
}

