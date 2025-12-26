/**
 * FAQ Block 类型定义
 */

export interface FAQItem {
  /** 问题 ID */
  id: string;
  /** 问题 */
  question: string;
  /** 答案 */
  answer: string;
}

export interface FAQData {
  /** FAQ 列表（向后兼容） */
  items?: FAQItem[];
  /** 是否默认展开第一个 */
  defaultOpenFirst?: boolean;
  /** 是否允许多个同时展开 */
  allowMultiple?: boolean;
  /** 主题样式 */
  theme?: 'default' | 'bordered' | 'minimal';
  /** 数据源模式：'metadata'（通过产品metadata）或 'direct'（直接配置） */
  dataMode?: 'metadata' | 'direct';
  /** 元字段配置（仅在metadata模式下使用） */
  metafieldConfig?: {
    key?: string;
  };
  /** 直接配置的数据（仅在direct模式下使用） */
  directItems?: FAQItem[];
  /** UI配置 */
  title?: string;
  subtitle?: string;
  showTitle?: boolean;
  showSubtitle?: boolean;
  titleAlign?: 'left' | 'center' | 'right';
  /** 搜索功能 */
  showSearch?: boolean;
  searchPlaceholder?: string;
  /** 图标类型 */
  iconType?: 'chevron' | 'plus' | 'arrow';
  /** 动画配置 */
  animationDuration?: number;
  /** 是否启用进入动画 */
  enableAnimation?: boolean;
}

export interface FAQBlockProps {
  /** FAQ Block 数据 */
  data: FAQData;
}

