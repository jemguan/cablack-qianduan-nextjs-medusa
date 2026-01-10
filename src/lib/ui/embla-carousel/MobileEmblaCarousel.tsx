"use client"

import { useCallback, useEffect, useRef, useState, Children } from "react"
import useEmblaCarousel from "embla-carousel-react"
import ChevronLeft from "@modules/common/icons/chevron-left"
import ChevronRight from "@modules/common/icons/chevron-right"
import type { EmblaCarouselProps } from "./types"
import { DEFAULT_EMBLA_CONFIG } from "./config"
import "./embla-carousel.css"

export function MobileEmblaCarousel({
  children,
  className = "",
  loop = DEFAULT_EMBLA_CONFIG.loop,
  autoplay = DEFAULT_EMBLA_CONFIG.autoplay,
  autoplayDelay = DEFAULT_EMBLA_CONFIG.autoplayDelay,
  duration = DEFAULT_EMBLA_CONFIG.duration,
  mobileSlidesPerView = DEFAULT_EMBLA_CONFIG.mobileSlidesPerView,
  spacing = DEFAULT_EMBLA_CONFIG.spacing,
  showNavigation = false,
  showPagination = DEFAULT_EMBLA_CONFIG.showPagination,
  align = DEFAULT_EMBLA_CONFIG.align,
  draggable = DEFAULT_EMBLA_CONFIG.draggable,
}: EmblaCarouselProps) {
  const childrenArray = Children.toArray(children)

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop,
    align,
    slidesToScroll: 1,
    duration,
    dragFree: !draggable,
    containScroll: "trimSnaps",
    axis: "x",
  })

  // 确保只在客户端和 DOM 元素存在时初始化
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 自动播放逻辑
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isMounted || !autoplay || !emblaApi || !emblaRef.current) return

    const startAutoplay = () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current)
      }
      autoplayTimerRef.current = setInterval(() => {
        if (emblaApi && emblaApi.canScrollNext()) {
          try {
            emblaApi.scrollNext()
          } catch (error) {
            // 忽略错误，可能是组件已卸载
            console.warn('[EmblaCarousel] Error scrolling:', error)
          }
        }
      }, autoplayDelay)
    }

    startAutoplay()

    // 当用户交互时暂停自动播放
    const handlePointerDown = () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current)
        autoplayTimerRef.current = null
      }
    }

    emblaApi.on("pointerDown", handlePointerDown)

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current)
        autoplayTimerRef.current = null
      }
      try {
        emblaApi.off("pointerDown", handlePointerDown)
      } catch (error) {
        // 忽略错误，可能是组件已卸载
      }
    }
  }, [isMounted, autoplay, autoplayDelay, emblaApi, emblaRef])

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const onInit = useCallback(() => {
    if (!emblaApi) return
    try {
      const snaps = emblaApi.scrollSnapList()
      setScrollSnaps(snaps)
    } catch (error) {
      console.warn('[EmblaCarousel] Error initializing scrollSnaps:', error)
    }
  }, [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    try {
      const index = emblaApi.selectedScrollSnap()
      setSelectedIndex(index)
    } catch (error) {
      console.warn('[EmblaCarousel Mobile] Error in onSelect:', error)
    }
  }, [emblaApi])

  useEffect(() => {
    if (!isMounted || !emblaApi) return

    // 初始化
    const init = () => {
      try {
        onInit()
        onSelect()
      } catch (error) {
        console.warn('[EmblaCarousel] Error initializing:', error)
      }
    }

    init()

    // 设置事件监听器 - 使用链式调用确保正确设置
    emblaApi.on("select", onSelect).on("reInit", onInit).on("reInit", onSelect)

    return () => {
      try {
        emblaApi.off("select", onSelect)
        emblaApi.off("reInit", onInit)
        emblaApi.off("reInit", onSelect)
      } catch (error) {
        // 忽略清理错误
      }
    }
  }, [isMounted, emblaApi, onInit, onSelect])

  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      try {
        emblaApi.scrollPrev()
      } catch (error) {
        console.warn('[EmblaCarousel] Error scrolling prev:', error)
      }
    }
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      try {
        emblaApi.scrollNext()
      } catch (error) {
        console.warn('[EmblaCarousel] Error scrolling next:', error)
      }
    }
  }, [emblaApi])

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) {
        try {
          emblaApi.scrollTo(index)
        } catch (error) {
          console.warn('[EmblaCarousel] Error scrolling to:', error)
        }
      }
    },
    [emblaApi]
  )

  if (childrenArray.length === 0) {
    return null
  }

  // 计算 slide 大小
  const slideSize = `${100 / mobileSlidesPerView}%`

  // 如果还没有挂载，返回占位符
  if (!isMounted) {
    const finalClassName = className ? `embla ${className}`.trim() : "embla"
    return (
      <div className={finalClassName}>
        <div className="flex items-center justify-center min-h-[300px] bg-muted rounded-lg">
          <span className="text-muted-foreground text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  const finalClassName = className ? `embla ${className}`.trim() : "embla"
  return (
    <div className={finalClassName}>
      <div className="embla__viewport" ref={emblaRef}>
        <div
          className="embla__container"
          style={{
            ['--slide-spacing' as string]: `${spacing}px`,
            ['--slide-size' as string]: slideSize,
          }}
        >
          {childrenArray.map((child, index) => (
            <div key={`slide-${index}`} className="embla__slide">
              <div className="embla__slide__inner">{child}</div>
            </div>
          ))}
        </div>
      </div>

      {showPagination && (() => {
        // 确定要渲染的分页点数量
        const totalDots = scrollSnaps.length > 0 ? scrollSnaps.length : childrenArray.length
        // 手机端最多只显示 7 个导航点
        const maxMobileDots = 7
        const dotsCount = Math.min(totalDots, maxMobileDots)
        
        // 如果总数量超过 7 个，计算均匀分布的索引
        const getDotIndex = (dotIndex: number): number => {
          if (totalDots <= maxMobileDots) {
            // 如果总数不超过 7 个，直接使用原始索引
            return dotIndex
          }
          // 如果总数超过 7 个，均匀分布
          // 例如：20 个位置，7 个点 -> 0, 3, 6, 9, 12, 15, 19
          const step = (totalDots - 1) / (maxMobileDots - 1)
          return Math.round(dotIndex * step)
        }
        
        // 判断当前选中的索引对应哪个导航点
        const getSelectedDotIndex = (): number => {
          if (totalDots <= maxMobileDots) {
            return selectedIndex
          }
          // 找到最接近当前选中索引的导航点
          const step = (totalDots - 1) / (maxMobileDots - 1)
          return Math.round(selectedIndex / step)
        }
        
        const selectedDotIndex = getSelectedDotIndex()
        
        return (
          <div className="embla__dots">
            {Array.from({ length: dotsCount }).map((_, dotIndex) => {
              const actualIndex = getDotIndex(dotIndex)
              return (
                <button
                  key={`dot-${dotIndex}`}
                  className={`embla__dot ${dotIndex === selectedDotIndex ? 'embla__dot--selected' : ''}`}
                  onClick={() => scrollTo(actualIndex)}
                  aria-label={`Go to slide ${actualIndex + 1}`}
                />
              )
            })}
          </div>
        )
      })()}
    </div>
  )
}

