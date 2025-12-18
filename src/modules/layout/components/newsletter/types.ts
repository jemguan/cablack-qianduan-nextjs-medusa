/**
 * Newsletter 组件属性
 */
export interface NewsletterProps {
  /** 标题 */
  title?: string;
  /** 描述 */
  description?: string;
  /** 输入框占位符文本 */
  placeholder?: string;
  /** 自定义类名 */
  className?: string;
}

/**
 * Newsletter 表单状态
 */
export type NewsletterFormState = 'idle' | 'submitting' | 'success' | 'error';

