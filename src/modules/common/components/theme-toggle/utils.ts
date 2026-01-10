import type {Theme} from './types';
import {THEME_CONFIG} from './config';

/**
 * 从本地存储获取保存的主题
 * @returns 保存的主题或默认主题
 */
export function getSavedTheme(): Theme {
  if (typeof window === 'undefined') {
    return THEME_CONFIG.defaultTheme;
  }

  try {
    const saved = localStorage.getItem(THEME_CONFIG.storageKey);
    return (saved as Theme) || THEME_CONFIG.defaultTheme;
  } catch {
    return THEME_CONFIG.defaultTheme;
  }
}

/**
 * 保存主题到本地存储
 * @param theme 要保存的主题
 */
export function saveTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(THEME_CONFIG.storageKey, theme);
  } catch {
    // 静默处理存储错误
  }
}

/**
 * 检测系统主题偏好
 * @returns 系统偏好的主题
 */
export function getSystemTheme(): Theme {
  if (typeof window === 'undefined') {
    return THEME_CONFIG.defaultTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}


/**
 * 应用主题到 DOM
 * @param theme 要应用的主题
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const body = document.body;

  // 添加过渡类以实现平滑切换
  body.classList.add('theme-transitioning');

  // 对于 Tailwind 的 class 模式，只需要添加或移除 'dark' 类
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // 设置 data 属性用于 CSS 选择器
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-mode', theme);

  // 设置 color-scheme 属性以优化浏览器渲染
  root.style.colorScheme = theme;

  // 过渡完成后移除过渡类
  setTimeout(() => {
    body.classList.remove('theme-transitioning');
  }, THEME_CONFIG.transitionDuration);
}

/**
 * 切换主题
 * @param currentTheme 当前主题
 * @returns 切换后的主题
 */
export function toggleTheme(currentTheme: Theme): Theme {
  return currentTheme === 'light' ? 'dark' : 'light';
}

