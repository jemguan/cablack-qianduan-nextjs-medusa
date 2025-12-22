"use server"

import { sdk } from "@lib/config"
import { getCacheConfig } from "@lib/config/cache"
import { getCacheOptions } from "./cookies"

export type Brand = {
  id: string
  name: string
  slug?: string | null
  description?: string | null
  logo_url?: string | null
  website_url?: string | null
  meta_title?: string | null
  meta_description?: string | null
  created_at: string
  updated_at: string
}

export const listBrands = async (
  queryParams: Record<string, string> = {}
): Promise<{ brands: Brand[]; count: number }> => {
  const next = {
    ...(await getCacheOptions("brands")),
  }

  queryParams.limit = queryParams.limit || "100"
  queryParams.offset = queryParams.offset || "0"

  const cacheConfig = getCacheConfig("BRAND")

  return sdk.client
    .fetch<{ brands: Brand[]; count: number }>(
      "/store/brands",
      {
        query: queryParams,
        next,
        ...cacheConfig,
      }
    )
    .then(({ brands, count }) => ({ brands, count }))
}

export const getBrandBySlug = async (
  slugOrId: string
): Promise<(Brand & { products?: any[] }) | null> => {
  const next = {
    ...(await getCacheOptions("brands")),
  }

  const cacheConfig = getCacheConfig("BRAND")

  try {
    const response = await sdk.client.fetch<{ brand: Brand & { products?: any[] } }>(
      `/store/brands/${slugOrId}`,
      {
        next,
        ...cacheConfig,
      }
    )
    return response.brand
  } catch (error) {
    return null
  }
}

export const getProductBrand = async (
  productId: string
): Promise<Brand | null> => {
  const next = {
    ...(await getCacheOptions("brands")),
  }

  const cacheConfig = getCacheConfig("BRAND")

  return sdk.client
    .fetch<{ brand: Brand | null }>(
      `/store/products/${productId}/brand`,
      {
        next,
        ...cacheConfig,
      }
    )
    .then(({ brand }) => brand)
    .catch(() => null)
}

