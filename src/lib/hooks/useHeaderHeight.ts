import {useState, useEffect} from 'react';

/**
 * 获取 Header 组件高度的 Hook
 * 
 * 通过查找页面上的 header 元素并监听其高度变化来动态获取 Header 高度
 * 支持响应式变化（例如移动端和桌面端高度不同）
 * 
 * @returns Header 的高度（像素），如果未找到则为 0
 */
export function useHeaderHeight(): number {
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined') {
      return;
    }

    // 查找 header 元素（优先使用 className="header" 选择器）
    const headerElement = (document.querySelector('header.header') || 
                          document.querySelector('header')) as HTMLElement;
    
    if (!headerElement) {
      return;
    }

    // 更新高度的函数
    const updateHeight = () => {
      const height = headerElement.offsetHeight;
      setHeaderHeight(height);
    };
    
    // 初始设置高度
    updateHeight();
    
    // 使用 ResizeObserver 监听高度变化
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });
    
    resizeObserver.observe(headerElement);
    
    // 监听窗口大小变化（处理响应式布局变化）
    const handleResize = () => {
      updateHeight();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return headerHeight;
}

