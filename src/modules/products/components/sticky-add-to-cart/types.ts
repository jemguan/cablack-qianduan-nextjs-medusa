import type { HttpTypes } from '@medusajs/types';

/**
 * 粘性购物栏组件属性
 */
export interface StickyAddToCartProps {
  /** 产品数据 */
  product: HttpTypes.StoreProduct;
  /** 区域信息 */
  region: HttpTypes.StoreRegion;
  /** 触发显示的目标元素引用（桌面端） */
  triggerRef?: React.RefObject<HTMLElement>;
  /** 移动端触发显示的目标元素引用 */
  mobileTriggerRef?: React.RefObject<HTMLElement>;
}

