/**
 * EmblaCarousel 组件类型定义
 */

export interface EmblaCarouselProps {
  /** 子元素 */
  children: React.ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 是否循环播放 */
  loop?: boolean;
  /** 是否启用自动播放 */
  autoplay?: boolean;
  /** 自动播放延迟（毫秒） */
  autoplayDelay?: number;
  /** 滑动速度（毫秒） */
  duration?: number;
  /** 桌面端显示的 slide 数量 */
  desktopSlidesPerView?: number;
  /** 移动端显示的 slide 数量 */
  mobileSlidesPerView?: number;
  /** Slide 之间的间距（px） */
  spacing?: number;
  /** 是否显示导航按钮 */
  showNavigation?: boolean;
  /** 是否显示分页器 */
  showPagination?: boolean;
  /** 对齐方式 */
  align?: 'start' | 'center' | 'end';
  /** 是否启用拖拽 */
  draggable?: boolean;
}

