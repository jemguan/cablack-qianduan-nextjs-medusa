import type { ReactNode, CSSProperties } from 'react';

/**
 * 玻璃效果组件 Props
 */
export interface GlassEffectProps {
  /** 子元素 */
  children: ReactNode;
  /** 自定义 className */
  className?: string;
  /** 自定义样式 */
  style?: CSSProperties;
  /** 是否启用玻璃效果（默认 true） */
  enabled?: boolean;
}

/**
 * 玻璃卡片组件 Props
 */
export interface GlassCardProps extends GlassEffectProps {
  /** 是否显示边框 */
  bordered?: boolean;
  /** 是否显示阴影 */
  shadowed?: boolean;
  /** 背景透明度（0-1） */
  opacity?: number;
  /** 模糊强度 */
  blur?: 'sm' | 'md' | 'lg';
}

