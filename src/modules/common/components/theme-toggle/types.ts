/**
 * 主题类型定义
 */
export type Theme = 'light' | 'dark';

/**
 * 主题上下文值接口
 */
export interface ThemeContextValue {
  /** 当前主题 */
  theme: Theme;
  /** 切换主题函数 */
  toggleTheme: () => void;
  /** 设置主题函数 */
  setTheme: (theme: Theme) => void;
}

/**
 * 主题切换按钮组件 Props
 */
export interface ThemeToggleProps {
  /** 按钮大小 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否显示文字标签 */
  showLabel?: boolean;
  /** 自定义类名 */
  className?: string;
}

