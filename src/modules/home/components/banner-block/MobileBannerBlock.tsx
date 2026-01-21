"use client"

import Image from 'next/image';
import Link from 'next/link';
import type { BannerBlockProps, BannerModuleData } from './types';
import { DEFAULT_BANNER_BLOCK_CONFIG } from './config';

/**
 * 获取图片 URL
 */
function getImageUrl(module: BannerModuleData): string | null {
  if (!module.image) return null;
  return typeof module.image === 'string' ? module.image : null;
}

/**
 * 单个 Banner 模块组件（移动端）
 * @param mobileGridCols - 移动端网格列数
 */
function BannerModule({ module, mobileGridCols = 1 }: { module: BannerModuleData; mobileGridCols?: number }) {
  const {
    link,
    linkTarget = '_self',
    showOnMobile = DEFAULT_BANNER_BLOCK_CONFIG.showOnMobile,
  } = module;

  // 如果移动端不可见，直接返回 null
  if (!showOnMobile) {
    return null;
  }

  const imageUrl = getImageUrl(module);
  if (!imageUrl || imageUrl.trim() === '') {
    return null;
  }

  const hasLink = !!link;

  // 根据网格列数计算 sizes
  // 移动端视口最大约 640px，减去 padding 约 32px = 608px
  // 单列时约 608px，双列时约 296px
  const getSizes = () => {
    const maxWidth = Math.round(608 / mobileGridCols);
    return `${maxWidth}px`;
  };

  const imageElement = (
    <div className="relative w-full overflow-hidden rounded-lg" style={{ padding: 0, margin: 0 }}>
      <Image
        src={imageUrl}
        alt="Banner image"
        width={800}
        height={400}
        className="w-full h-auto object-cover"
        style={{ display: 'block' }}
        sizes={getSizes()}
        quality={75}
      />
    </div>
  );

  // 如果有链接，整个 banner 可点击
  if (hasLink) {
    return (
      <Link href={link} target={linkTarget} className="block w-full">
        {imageElement}
      </Link>
    );
  }

  // 否则只显示图片
  return imageElement;
}

/**
 * 移动端 Banner Block 组件
 * 用于在移动端展示多个 banner 模块，支持网格布局
 */
export function MobileBannerBlock({ data }: BannerBlockProps) {
  const { modules, mobileGridCols = 1 } = data;

  if (!modules || modules.length === 0) {
    return (
      <div className="w-full py-8 text-center text-muted-foreground">
        暂无 banner 内容
      </div>
    );
  }

  // 获取可见的模块
  const visibleModules = modules.filter(module => module.showOnMobile !== false);

  // 使用CSS Grid布局
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${mobileGridCols}, 1fr)`,
    gap: '1rem',
    width: '100%',
  };

  return (
    <div style={gridStyle}>
      {visibleModules.map((module) => (
        <BannerModule key={module.id} module={module} mobileGridCols={mobileGridCols} />
      ))}
    </div>
  );
}
