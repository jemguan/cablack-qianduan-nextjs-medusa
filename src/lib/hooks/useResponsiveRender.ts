import {useState, useEffect} from 'react';

// 全局状态，避免多个组件重复创建监听器
// 优化：使用 WeakSet 来存储监听器，避免强引用导致的内存泄漏
let globalIsDesktop = false;
let globalIsHydrated = false;
// 注意：WeakSet 只能存储对象，所以我们需要使用 WeakMap 来存储函数引用
// 但由于函数不是对象，我们仍然使用 Set，但会在清理时主动删除
let resizeListeners: Set<() => void> = new Set();
let resizeTimer: ReturnType<typeof setTimeout> | null = null;
let handleResize: (() => void) | null = null;
let isListenerInitialized = false;

// 定期清理无效的监听器引用（防止内存泄漏）
function cleanupDeadListeners() {
  // 由于无法检测函数是否已失效，我们依赖组件卸载时的清理
  // 但如果监听器数量异常增长，强制清理（降低阈值以更早清理）
  if (resizeListeners.size > 50) {
    resizeListeners.clear();
    // 重置初始化状态，允许重新初始化监听器
    isListenerInitialized = false;
  }
}

// 全局 resize 监听器（单例模式）
function initGlobalResizeListener() {
  if (typeof window === 'undefined') {
    return () => {}; // 返回空清理函数
  }

  // 如果已经初始化，返回空清理函数（因为监听器是全局的，不应该在这里清理）
  if (isListenerInitialized) {
    return () => {}; // 返回空清理函数
  }

  handleResize = () => {
    if (resizeTimer) {
      clearTimeout(resizeTimer);
    }
    resizeTimer = setTimeout(() => {
      const newIsDesktop = window.innerWidth >= 768;
      if (newIsDesktop !== globalIsDesktop) {
        globalIsDesktop = newIsDesktop;
        // 通知所有订阅者
        resizeListeners.forEach(listener => listener());
      }
    }, 150);
  };

  window.addEventListener('resize', handleResize, { passive: true });
  
  // 初始判断
  globalIsDesktop = window.innerWidth >= 768;
  globalIsHydrated = true;
  isListenerInitialized = true;

  // 返回清理函数
  return () => {
    if (handleResize) {
      window.removeEventListener('resize', handleResize);
      handleResize = null;
    }
    if (resizeTimer) {
      clearTimeout(resizeTimer);
      resizeTimer = null;
    }
    isListenerInitialized = false;
  };
}

/**
 * 响应式渲染 Hook
 * 只在客户端根据屏幕尺寸渲染对应组件，避免同时渲染两个组件浪费内存
 * 
 * 优化：使用全局状态和单例监听器，避免多个组件重复创建 resize 监听器
 */
export function useResponsiveRender() {
  const [isDesktop, setIsDesktop] = useState<boolean>(globalIsDesktop);
  const [isHydrated, setIsHydrated] = useState(globalIsHydrated);

  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined') {
      return;
    }

    // 初始化全局监听器（如果还没有）
    const cleanupGlobal = initGlobalResizeListener();

    // 更新本地状态（只在值变化时更新，避免不必要的重渲染）
    setIsDesktop((prevIsDesktop) => {
      if (prevIsDesktop !== globalIsDesktop) {
        return globalIsDesktop;
      }
      return prevIsDesktop;
    });
    setIsHydrated(true);

    // 订阅全局状态变化（使用函数式更新，只在值真正变化时才更新）
    const updateState = () => {
      setIsDesktop((prevIsDesktop) => {
        // 只在值真正变化时才更新，避免不必要的重渲染
        if (prevIsDesktop !== globalIsDesktop) {
          return globalIsDesktop;
        }
        return prevIsDesktop;
      });
    };
    
    resizeListeners.add(updateState);

    return () => {
      resizeListeners.delete(updateState);
      // 如果没有订阅者了，清理全局监听器
      if (resizeListeners.size === 0 && cleanupGlobal) {
        cleanupGlobal();
      }
    };
  }, []);

  return {isDesktop, isHydrated};
}

