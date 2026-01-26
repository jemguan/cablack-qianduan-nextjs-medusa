/**
 * 支付方式
 */
export interface PaymentMethod {
  /** 支付方式名称 */
  name: string;
  /** 图标 URL */
  iconUrl?: string;
  /** 亮色主题图标 URL */
  lightIconUrl?: string;
  /** 暗色主题图标 URL */
  darkIconUrl?: string;
}

/**
 * Announcement 组件属性
 */
export interface AnnouncementProps {
  /** 主标题 */
  title?: string;
  /** 副标题 */
  subtitle?: string;
  /** 公告文字 */
  text?: string;
  /** 链接地址（可选） */
  link?: string;
  /** 链接文字（可选） */
  linkText?: string;
  /** 图片 URL（可选） */
  imageUrl?: string;
  /** 亮色主题 Logo URL（可选） */
  lightLogoUrl?: string;
  /** 暗色主题 Logo URL（可选） */
  darkLogoUrl?: string;
  /** 图片大小（px，可选） */
  imageSizePx?: number;
  /** 支付方式列表 */
  paymentMethods?: PaymentMethod[];
  /** 自定义类名 */
  className?: string;
}

