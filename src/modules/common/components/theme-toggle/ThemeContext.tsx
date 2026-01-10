"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type {Theme, ThemeContextValue} from './types';
import {
  getSavedTheme,
  saveTheme,
  applyTheme,
  toggleTheme as toggleThemeUtil,
} from './utils';

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * 主题上下文提供者组件
 * @param children 子组件
 */
export function ThemeProvider({children}: {children: ReactNode}) {
  const [theme, setThemeState] = useState<Theme>('light'); // 服务端默认浅色主题
  const [isHydrated, setIsHydrated] = useState(false);

  // 客户端水合时获取保存的主题
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = getSavedTheme();
      setThemeState(savedTheme);
      setIsHydrated(true);
      
      // 确保主题已应用到 DOM
      applyTheme(savedTheme);
    }
  }, []);

  // 应用主题到 DOM - 只在主题变化且已水合时执行
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      applyTheme(theme);
    }
  }, [theme, isHydrated]);

  /**
   * 设置主题
   * @param newTheme 新主题
   */
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    saveTheme(newTheme);
  };

  /**
   * 切换主题
   */
  const toggleTheme = () => {
    const newTheme = toggleThemeUtil(theme);
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * 使用主题上下文的 Hook
 * @returns 主题上下文值
 * @throws 如果在 ThemeProvider 外部使用则抛出错误
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

