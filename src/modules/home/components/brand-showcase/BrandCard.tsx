"use client"

import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { Brand } from "./types"
import { getBrandUrl } from "./utils"

interface BrandCardProps {
  /** 品牌数据 */
  brand: Brand;
  /** 是否显示品牌名称 */
  showBrandName?: boolean;
  /** 图片适应方式 */
  imageFit?: 'cover' | 'contain';
}

/**
 * 品牌卡片组件
 * 用于展示单个品牌信息，点击后跳转到品牌页面
 */
export function BrandCard({
  brand,
  showBrandName = true,
  imageFit = 'contain',
}: BrandCardProps) {
  const brandUrl = getBrandUrl(brand.slug, brand.id);

  return (
    <div className="group overflow-hidden h-full flex flex-col">
      <LocalizedClientLink
        href={brandUrl}
        className="flex flex-col h-full"
        aria-label={`View ${brand.name} products`}
      >
        {/* 品牌图片 */}
        <div className="flex-shrink-0 w-full bg-muted rounded-lg relative overflow-hidden aspect-square">
          <Image
            src={brand.image}
            alt={brand.name}
            fill
            className={`${imageFit === 'cover' ? 'object-cover' : 'object-contain'} group-hover:scale-105 transition-transform duration-300`}
            loading="lazy"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        </div>

        {/* 品牌信息 */}
        {showBrandName && (
          <div className="p-2 flex-1 flex flex-col">
            <h4
              className="text-lg font-medium group-hover:text-primary transition-colors leading-tight m-0"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                minHeight: '2.8em',
              }}
            >
              {brand.name}
            </h4>
          </div>
        )}
      </LocalizedClientLink>
    </div>
  );
}

