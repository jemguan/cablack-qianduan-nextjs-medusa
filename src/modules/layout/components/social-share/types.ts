/**
 * 社交媒体平台类型
 */
export type SocialPlatform =
  | "facebook"
  | "twitter"
  | "instagram"
  | "linkedin"
  | "pinterest"
  | "whatsapp"
  | "email"
  | "copy"

/**
 * SocialShare 组件属性
 */
export interface SocialShareProps {
  /** 要显示的平台列表 */
  platforms?: SocialPlatform[]
  /** 自定义类名 */
  className?: string
}

