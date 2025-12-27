"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { getGlassClassName, getGlassStyle } from './utils';
import type { GlassCardProps } from './types';

/**
 * 玻璃卡片组件
 *
 * 提供统一的玻璃态（Glassmorphism）样式，包括：
 * - 半透明背景
 * - 背景模糊效果
 * - 边框和阴影
 *
 * 使用场景：
 * - 粘性购物栏
 * - 浮动卡片
 * - 模态框背景
 */
export function GlassCard({
  children,
  className = '',
  style = {},
  enabled = true,
  bordered = true,
  shadowed = true,
  opacity = 0.05,
  blur = 'md',
}: GlassCardProps) {
  if (!enabled) {
    return <div className={className} style={style}>{children}</div>;
  }

  // 构建背景透明度样式
  // 使用 CSS 变量和内联样式来支持暗色模式
  // 使用 hsl(var(--background)) 来获取当前主题的背景色
  const bgStyle: React.CSSProperties = {
    backgroundColor: `hsl(var(--background) / ${opacity})`,
  };

  // 构建模糊类名
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
  };

  // 构建边框类名
  // 使用 Medusa UI 的边框颜色系统
  const borderClass = bordered
    ? 'border border-ui-border-base'
    : '';

  // 构建阴影样式
  // 使用更通用的阴影，适配暗色模式
  const shadowStyle: React.CSSProperties = shadowed
    ? {
        boxShadow:
          '0 4px 16px 0 rgba(0, 0, 0, 0.1), 0 0 0 1px hsl(var(--border) / 0.1) inset',
      }
    : {};

  const glassClassName = cn(
    blurClasses[blur],
    borderClass,
    'transition-colors duration-200',
    className,
  );

  // 合并样式，优先使用传入的 style
  const glassStyle: React.CSSProperties = {
    ...bgStyle,
    ...shadowStyle,
    ...style,
  };

  return (
    <div className={glassClassName} style={glassStyle}>
      {children}
    </div>
  );
}

