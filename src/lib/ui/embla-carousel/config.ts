/**
 * EmblaCarousel 默认配置
 */
export const DEFAULT_EMBLA_CONFIG = {
  /** 桌面端显示的 slide 数量 */
  desktopSlidesPerView: 4,
  /** 移动端显示的 slide 数量 */
  mobileSlidesPerView: 1.5,
  /** Slide 之间的间距（px） */
  spacing: 16,
  /** 是否循环播放 */
  loop: false,
  /** 是否启用自动播放 */
  autoplay: false,
  /** 自动播放延迟（毫秒） */
  autoplayDelay: 3000,
  /** 滑动速度（毫秒） */
  duration: 25,
  /** 是否显示导航按钮 */
  showNavigation: true,
  /** 是否显示分页器 */
  showPagination: false,
  /** 对齐方式 */
  align: 'start' as const,
  /** 是否启用拖拽 */
  draggable: true,
} as const;

