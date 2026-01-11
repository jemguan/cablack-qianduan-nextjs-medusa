import type { HttpTypes } from '@medusajs/types';
import type { LoyaltyAccount } from '@/types/loyalty';

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
  /** 当前登录的客户 */
  customer?: HttpTypes.StoreCustomer | null;
  /** 积分账户信息 */
  loyaltyAccount?: LoyaltyAccount | null;
  /** 会员产品 ID 列表 */
  membershipProductIds?: Record<string, boolean> | null;
}

