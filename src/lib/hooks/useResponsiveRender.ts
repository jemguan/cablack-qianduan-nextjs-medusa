import {useState, useEffect, useRef} from 'react';

// 全局状态，避免多个组件重复创建监听器
let globalIsDesktop = false;
let globalIsHydrated = false;
// 使用 Set 存储监听器，组件卸载时会主动删除
let resizeListeners: Set<() => void> = new Set();
let resizeTimer: ReturnType<typeof setTimeout> | null = null;
let handleResize: (() => void) | null = null;
let isListenerInitialized = false;

// 降低阈值，更早清理异常增长的监听器（防止内存泄漏）
const MAX_LISTENERS = 20;

// 检查并清理异常增长的监听器
function checkAndCleanupListeners() {
  // 如果监听器数量异常增长，说明有组件没有正确清理
  // 强制清理所有监听器，重置状态
  if (resizeListeners.size > MAX_LISTENERS) {
    console.warn(`[useResponsiveRender] Too many listeners (${resizeListeners.size}), forcing cleanup`);
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
        // 在通知订阅者前检查监听器数量
        checkAndCleanupListeners();
        // 通知所有订阅者
        resizeListeners.forEach(listener => {
          try {
            listener();
          } catch (error) {
            // 如果监听器抛出错误，从集合中移除它
            console.warn('[useResponsiveRender] Listener threw error, removing:', error);
            resizeListeners.delete(listener);
          }
        });
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
  
  // 使用 ref 跟踪组件是否已卸载
  const isMountedRef = useRef(true);
  // 使用 ref 存储 updateState 函数，确保清理时能正确移除
  const updateStateRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // 标记组件已挂载
    isMountedRef.current = true;
    
    // 只在客户端执行
    if (typeof window === 'undefined') {
      return;
    }

    // 初始化全局监听器（如果还没有）
    const cleanupGlobal = initGlobalResizeListener();

    // 更新本地状态（只在值变化时更新，避免不必要的重渲染）
    if (isMountedRef.current) {
      setIsDesktop((prevIsDesktop) => {
        if (prevIsDesktop !== globalIsDesktop) {
          return globalIsDesktop;
        }
        return prevIsDesktop;
      });
      setIsHydrated(true);
    }

    // 订阅全局状态变化（使用函数式更新，只在值真正变化时才更新）
    const updateState = () => {
      if (isMountedRef.current) {
        setIsDesktop((prevIsDesktop) => {
          // 只在值真正变化时才更新，避免不必要的重渲染
          if (prevIsDesktop !== globalIsDesktop) {
            return globalIsDesktop;
          }
          return prevIsDesktop;
        });
      }
    };
    
    updateStateRef.current = updateState;
    resizeListeners.add(updateState);

    return () => {
      // 标记组件已卸载
      isMountedRef.current = false;
      
      // 移除监听器
      if (updateStateRef.current) {
        resizeListeners.delete(updateStateRef.current);
        updateStateRef.current = null;
      }
      
      // 如果没有订阅者了，清理全局监听器
      if (resizeListeners.size === 0 && cleanupGlobal) {
        cleanupGlobal();
      }
    };
  }, []);

  return {isDesktop, isHydrated};
}
