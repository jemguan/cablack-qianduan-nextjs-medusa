import type {CSSProperties} from 'react';

/**
 * 获取玻璃效果的 className
 */
export function getGlassClassName(enabled: boolean): string {
  return enabled
    ? 'bg-background/5 backdrop-blur-md border border-white/10'
    : '';
}

/**
 * 获取玻璃效果的样式对象
 */
export function getGlassStyle(enabled: boolean): CSSProperties | undefined {
  return enabled
    ? {
        boxShadow: '-4px 4px 16px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
      }
    : undefined;
}

