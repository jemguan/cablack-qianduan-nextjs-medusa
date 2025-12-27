/**
 * 检查元素是否在视口中
 * @param element 要检查的元素
 * @returns 元素是否在视口中
 */
export function isElementInViewport(element: HTMLElement | null): boolean {
  if (!element) return true;

  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * 检查元素是否滚动出视口
 * @param element 要检查的元素
 * @returns 元素是否滚动出视口
 */
export function isElementScrolledOut(element: HTMLElement | null): boolean {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  return rect.bottom < 0;
}

/**
 * 检查页面是否滚动到底部
 * @param threshold 距离底部的阈值（像素），默认 100
 * @returns 是否接近或到达页面底部
 */
export function isNearPageBottom(threshold: number = 100): boolean {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight;
  const clientHeight = window.innerHeight || document.documentElement.clientHeight;

  // 计算距离底部的距离
  const distanceToBottom = scrollHeight - (scrollTop + clientHeight);

  return distanceToBottom <= threshold;
}

