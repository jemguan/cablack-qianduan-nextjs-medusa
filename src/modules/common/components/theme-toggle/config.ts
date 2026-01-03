import type {Theme} from './types';

/**
 * 主题切换组件配置常量
 */
export const THEME_CONFIG = {
  /** 默认主题 */
  defaultTheme: 'dark' as Theme,
  
  /** 本地存储键名 */
  storageKey: 'theme-preference',
  
  /** 按钮尺寸配置 */
  buttonSizes: {
    sm: 'w-8 h-8 p-1',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-3',
  },
  
  /** 图标尺寸配置 */
  iconSizes: {
    sm: 16,
    md: 20,
    lg: 24,
  },
  
  /** 主题对应的 CSS 类名 */
  themeClasses: {
    light: 'light',
    dark: 'dark',
  },
  
  /** 动画持续时间 */
  transitionDuration: 200,
} as const;

