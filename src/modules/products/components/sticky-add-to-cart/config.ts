/**
 * 粘性购物栏配置
 */
export const STICKY_ADD_TO_CART_CONFIG = {
  /** 触发显示的滚动阈值（像素） */
  scrollThreshold: 100,
  /** 动画持续时间（毫秒） */
  animationDuration: 300,
  /** 桌面端高度 */
  desktopHeight: '80px',
  /** 移动端高度 */
  mobileHeight: '72px',
  /** Z-index 层级 - 设置为最高层级 */
  zIndex: 9999,
  /** 距离页面底部的阈值（像素），到达此距离时隐藏粘性购物栏 */
  bottomThreshold: 150,
} as const;

