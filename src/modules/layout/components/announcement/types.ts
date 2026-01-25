/**
 * Announcement 组件属性
 */
export interface AnnouncementProps {
  /** 公告文字 */
  text: string;
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
  /** 自定义类名 */
  className?: string;
}

