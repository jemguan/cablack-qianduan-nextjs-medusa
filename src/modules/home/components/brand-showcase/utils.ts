import type { Brand } from './types';

/**
 * 生成品牌页面 URL
 * @param slug 品牌 slug，如果为空则使用 id
 * @param id 品牌 id（作为后备）
 * @returns 品牌页面 URL
 */
export function getBrandUrl(slug?: string, id?: string): string {
  const identifier = slug || id || '';
  return `/brands/${identifier}`;
}

