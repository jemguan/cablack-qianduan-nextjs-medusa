import type { ViewedProduct, ViewingHistory } from './types';
import { PERFORMANCE_CONFIG, STORAGE_CONFIG } from './config';
import type { HttpTypes } from '@medusajs/types';

/**
 * 验证是否为有效的ViewingHistory数据结构
 */
function isValidViewingHistory(data: unknown): data is ViewingHistory {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // 检查必需的字段
  if (typeof obj.lastUpdated !== 'number' || !Array.isArray(obj.products)) {
    return false;
  }

  // 检查products数组中的每个元素
  return obj.products.every((product: unknown) => {
    if (!product || typeof product !== 'object') {
      return false;
    }

    const p = product as Record<string, unknown>;
    return (
      typeof p.id === 'string' &&
      typeof p.title === 'string' &&
      typeof p.handle === 'string' &&
      typeof p.viewedAt === 'number' &&
      (typeof p.imageUrl === 'string' || p.imageUrl === undefined) &&
      (typeof p.imageAlt === 'string' || p.imageAlt === undefined) &&
      (typeof p.vendor === 'string' || p.vendor === undefined) &&
      (p.price === undefined ||
        (typeof p.price === 'object' &&
          p.price !== null &&
          typeof (p.price as Record<string, unknown>).amount === 'string' &&
          typeof (p.price as Record<string, unknown>).currencyCode ===
            'string')) &&
      (p.compareAtPrice === undefined ||
        p.compareAtPrice === null ||
        (typeof p.compareAtPrice === 'object' &&
          p.compareAtPrice !== null &&
          typeof (p.compareAtPrice as Record<string, unknown>).amount ===
            'string' &&
          typeof (p.compareAtPrice as Record<string, unknown>).currencyCode ===
            'string'))
    );
  });
}

/**
 * 验证并限制产品数量
 */
export function validateProductLimit(limit: number): number {
  if (limit <= 0) return PERFORMANCE_CONFIG.maxDisplayProducts;
  return Math.min(limit, PERFORMANCE_CONFIG.maxDisplayProducts);
}

/**
 * 检查localStorage是否可用
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * 从localStorage获取浏览历史
 */
export function getViewingHistory(): ViewingHistory {
  if (!isLocalStorageAvailable()) {
    return { products: [], lastUpdated: Date.now() };
  }

  try {
    const stored = localStorage.getItem(STORAGE_CONFIG.storageKey);
    if (!stored) {
      return { products: [], lastUpdated: Date.now() };
    }

    const parsed: unknown = JSON.parse(stored);

    // 验证数据结构
    if (!isValidViewingHistory(parsed)) {
      localStorage.removeItem(STORAGE_CONFIG.storageKey);
      return { products: [], lastUpdated: Date.now() };
    }

    const history: ViewingHistory = parsed;

    // 检查数据是否过期
    const now = Date.now();
    if (now - history.lastUpdated > STORAGE_CONFIG.expirationTime) {
      localStorage.removeItem(STORAGE_CONFIG.storageKey);
      return { products: [], lastUpdated: now };
    }

    // 过滤过期的产品（超过30天的浏览记录）
    const validProducts = history.products.filter(
      (product) => now - product.viewedAt <= STORAGE_CONFIG.expirationTime,
    );

    return {
      products: validProducts,
      lastUpdated: history.lastUpdated,
    };
  } catch (error) {
    console.warn('获取浏览历史失败:', error);
    return { products: [], lastUpdated: Date.now() };
  }
}

/**
 * 保存浏览历史到localStorage
 */
export function saveViewingHistory(history: ViewingHistory): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    // 限制存储的产品数量
    const limitedHistory = {
      ...history,
      products: history.products.slice(0, STORAGE_CONFIG.maxStoredProducts),
      lastUpdated: Date.now(),
    };

    localStorage.setItem(
      STORAGE_CONFIG.storageKey,
      JSON.stringify(limitedHistory),
    );
  } catch (error) {
    console.warn('保存浏览历史失败:', error);
  }
}

/**
 * 添加产品到浏览历史
 */
export function addProductToHistory(
  product: Omit<ViewedProduct, 'viewedAt'>,
): void {
  const history = getViewingHistory();
  const now = Date.now();

  // 移除已存在的相同产品（避免重复）
  const filteredProducts = history.products.filter((p) => p.id !== product.id);

  // 添加新产品到开头
  const newProduct: ViewedProduct = {
    ...product,
    viewedAt: now,
  };

  const updatedHistory: ViewingHistory = {
    products: [newProduct, ...filteredProducts],
    lastUpdated: now,
  };

  saveViewingHistory(updatedHistory);
}

/**
 * 获取最近浏览的产品列表（排除当前产品）
 */
export function getRecentlyViewedProducts(
  limit: number = PERFORMANCE_CONFIG.maxDisplayProducts,
  excludeProductId?: string,
): ViewedProduct[] {
  const history = getViewingHistory();

  let products = history.products;

  // 排除当前产品
  if (excludeProductId) {
    products = products.filter((product) => product.id !== excludeProductId);
  }

  // 按浏览时间排序（最新的在前）并限制数量
  return products.sort((a, b) => b.viewedAt - a.viewedAt).slice(0, limit);
}

/**
 * 清空浏览历史
 */
export function clearViewingHistory(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_CONFIG.storageKey);
  } catch (error) {
    console.warn('清空浏览历史失败:', error);
  }
}

/**
 * 将ViewedProduct转换为Medusa产品格式（用于ProductPreview组件）
 * 注意：这是一个简化版本，只包含ProductPreview需要的基本字段
 */
export function adaptViewedProductToMedusaProduct(
  viewedProduct: ViewedProduct,
): HttpTypes.StoreProduct {
  // 构建图片数据
  const imageData = viewedProduct.imageUrl
    ? [
        {
          id: `${viewedProduct.id}_image`,
          url: viewedProduct.imageUrl,
          rank: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          metadata: {},
        },
      ]
    : [];

  // 构建变体数据 - 使用类型断言处理可选属性
  const variant = {
    id: `${viewedProduct.id}_variant`,
    title: 'Default Title',
    sku: '',
    barcode: '',
    ean: '',
    upc: '',
    hs_code: null,
    thumbnail: viewedProduct.imageUrl || null,
    inventory_quantity: 0,
    allow_backorder: false,
    manage_inventory: true,
    weight: null,
    length: null,
    height: null,
    width: null,
    origin_country: null,
    mid_code: null,
    material: null,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    product_id: viewedProduct.id,
    options: [],
    calculated_price: viewedProduct.price
      ? {
          id: '',
          calculated_amount: parseFloat(viewedProduct.price.amount),
          currency_code: viewedProduct.price.currencyCode,
          calculated_price: {
            id: '',
            price_list_id: null,
            price_list_type: 'default',
            min_quantity: null,
            max_quantity: null,
          },
          original_amount: viewedProduct.compareAtPrice
            ? parseFloat(viewedProduct.compareAtPrice.amount)
            : parseFloat(viewedProduct.price.amount),
          original_amount_with_tax: viewedProduct.compareAtPrice
            ? parseFloat(viewedProduct.compareAtPrice.amount)
            : parseFloat(viewedProduct.price.amount),
          original_amount_without_tax: viewedProduct.compareAtPrice
            ? parseFloat(viewedProduct.compareAtPrice.amount)
            : parseFloat(viewedProduct.price.amount),
        }
      : undefined,
    images: imageData,
  } as unknown as HttpTypes.StoreProductVariant;

  // 构建产品数据 - 使用类型断言处理复杂类型
  const product = {
    id: viewedProduct.id,
    title: viewedProduct.title,
    subtitle: null,
    description: null,
    handle: viewedProduct.handle,
    is_giftcard: false,
    status: 'published',
    images: imageData,
    thumbnail: viewedProduct.imageUrl || null,
    options: [],
    variants: [variant],
    tags: [],
    type: null,
    collection_id: null,
    collection: null,
    categories: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    metadata: {},
    sales_channels: [],
  } as unknown as HttpTypes.StoreProduct;

  return product;
}

/**
 * 批量转换ViewedProduct数据为Medusa产品格式
 */
export function adaptViewedProductsToMedusaProducts(
  viewedProducts: ViewedProduct[],
): HttpTypes.StoreProduct[] {
  return viewedProducts.map(adaptViewedProductToMedusaProduct);
}

