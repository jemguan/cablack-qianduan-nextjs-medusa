"use client"

import type {ThemeToggleProps} from './types';
import {useTheme} from './ThemeContext';
import {THEME_CONFIG} from './config';
import Sun from '@modules/common/icons/sun';
import Moon from '@modules/common/icons/moon';

/**
 * 主题切换按钮组件
 * @param size 按钮大小
 * @param showLabel 是否显示文字标签
 * @param className 自定义类名
 */
export function ThemeToggle({
  size = 'md',
  showLabel = false,
  className = '',
}: ThemeToggleProps) {
  const {theme, toggleTheme} = useTheme();
  const isDark = theme === 'dark';
  const iconSize = THEME_CONFIG.iconSizes[size];

  // 使用 Medusa UI 风格的按钮样式，与导航栏其他按钮保持一致
  const buttonClassName = className || `inline-flex items-center justify-center text-ui-fg-subtle hover:text-ui-fg-base focus:outline-none transition-colors ${THEME_CONFIG.buttonSizes[size]}`;

  return (
    <button
      onClick={toggleTheme}
      className={buttonClassName}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun size={iconSize} />
      ) : (
        <Moon size={iconSize} />
      )}
      
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}

