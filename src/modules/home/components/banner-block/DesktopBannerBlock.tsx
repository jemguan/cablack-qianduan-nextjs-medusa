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
 * 单个 Banner 模块组件（桌面端）
 * @param module - Banner 模块数据
 * @param fillHeight - 是否填充满容器高度（用于 rowSpan > 1 的情况）
 */
function BannerModule({ module, fillHeight = false }: { module: BannerModuleData; fillHeight?: boolean }) {
  const {
    link,
    linkTarget = '_self',
    showOnDesktop = DEFAULT_BANNER_BLOCK_CONFIG.showOnDesktop,
  } = module;

  // 如果桌面端不可见，直接返回 null
  if (!showOnDesktop) {
    return null;
  }

  const imageUrl = getImageUrl(module);
  if (!imageUrl || imageUrl.trim() === '') {
    return null;
  }

  const hasLink = !!link;

  // 如果需要填充高度（使用 rowSpan），使用 fill 模式
  // 否则使用自然尺寸，让容器跟随图片高度
  // 有链接时添加悬停动画效果
  const hoverClass = hasLink ? 'transition-all duration-300 hover:scale-[1.005] hover:brightness-[1.02]' : '';
  
  const imageElement = fillHeight ? (
    <div className={`relative w-full h-full overflow-hidden rounded-lg ${hoverClass}`}>
      <Image
        src={imageUrl}
        alt="Banner image"
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        unoptimized={imageUrl.startsWith('http') || imageUrl.startsWith('//')}
      />
    </div>
  ) : (
    <div className={`relative w-full overflow-hidden rounded-lg ${hoverClass}`} style={{ padding: 0, margin: 0 }}>
      <img
        src={imageUrl}
        alt="Banner image"
        className="w-full h-auto object-cover"
        style={{ display: 'block' }}
      />
    </div>
  );

  // 如果有链接，整个 banner 可点击
  if (hasLink) {
    return (
      <Link 
        href={link} 
        target={linkTarget} 
        className={`block w-full ${fillHeight ? 'h-full' : ''}`}
      >
        {imageElement}
      </Link>
    );
  }

  // 否则只显示图片
  return imageElement;
}

/**
 * 桌面端 Banner Block 组件
 * 用于在桌面端展示多个 banner 模块，支持网格布局
 */
export function DesktopBannerBlock({ data }: BannerBlockProps) {
  const { modules, gridCols = 1, gridGap = 24 } = data;

  if (!modules || modules.length === 0) {
    return (
      <div className="w-full py-8 text-center text-muted-foreground">
        暂无 banner 内容
      </div>
    );
  }

  // 获取可见的模块
  const visibleModules = modules.filter(module => module.showOnDesktop !== false);

  // 确保 gridCols 是数字
  const cols = typeof gridCols === 'number' ? gridCols : parseInt(String(gridCols), 10) || 1;
  const gap = typeof gridGap === 'number' ? gridGap : parseInt(String(gridGap), 10) || 24;

  // 检查是否有任何模块使用了 rowSpan
  const hasRowSpan = visibleModules.some(m => (m.rowSpan || 1) > 1);

  // 使用CSS Grid布局
  // 如果有模块使用了 rowSpan，使用 1fr 让每行高度相等
  // 否则使用 auto 让行高度由内容决定
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridAutoRows: hasRowSpan ? '1fr' : 'auto',
    gridAutoFlow: 'row dense',
    gap: `${gap}px`,
    width: '100%',
    alignContent: 'start',
  };

  return (
    <div style={gridStyle}>
      {visibleModules.map((module) => {
        const moduleCols = typeof module.desktopCols === 'number' 
          ? module.desktopCols 
          : parseInt(String(module.desktopCols), 10) || 1;
        const moduleRows = typeof module.rowSpan === 'number' 
          ? module.rowSpan 
          : parseInt(String(module.rowSpan), 10) || 1;

        const gridItemStyle: React.CSSProperties = {
          gridColumn: `span ${moduleCols}`,
          gridRow: moduleRows > 1 ? `span ${moduleRows}` : undefined,
        };

        return (
          <div 
            key={module.id} 
            style={gridItemStyle}
            className={moduleRows > 1 ? "h-full" : ""}
          >
            <BannerModule module={module} fillHeight={moduleRows > 1} />
          </div>
        );
      })}
    </div>
  );
}
