"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { useResponsiveRender } from "@lib/hooks/useResponsiveRender"
import type { SlideshowBlockProps, SlideData } from "./types"

export function SlideshowBlock({ data }: SlideshowBlockProps) {
  const { isDesktop, isHydrated } = useResponsiveRender()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const {
    slides,
    autoplay = true,
    autoplayDelay = 5000,
    loop = true,
    showNavigation = true,
    showPagination = true,
    effect = "slide",
    speed = 500,
    fullWidth = false,
    overlayOpacity = 0.3,
  } = data

  const plugins = []
  if (autoplay) {
    plugins.push(
      Autoplay({
        delay: autoplayDelay,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      })
    )
  }

  const isFade = effect === "fade"

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop,
      duration: speed,
      ...(isFade ? { watchDrag: false } : {}),
    },
    plugins
  )

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi, onSelect])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  )

  if (!isHydrated) return null
  if (!slides || slides.length === 0) return null

  const content = (
    <div className="relative group">
      {/* Embla viewport */}
      <div ref={emblaRef} className="overflow-hidden rounded-lg">
        <div
          className={`flex ${isFade ? "relative" : ""}`}
          style={isFade ? { height: "100%" } : undefined}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`relative flex-[0_0_100%] min-w-0 ${
                isFade
                  ? "absolute inset-0 transition-opacity duration-500"
                  : ""
              }`}
              style={
                isFade
                  ? {
                      opacity: index === selectedIndex ? 1 : 0,
                      pointerEvents:
                        index === selectedIndex ? "auto" : "none",
                    }
                  : undefined
              }
            >
              <SlideContent
                slide={slide}
                overlayOpacity={overlayOpacity}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 导航箭头 */}
      {showNavigation && slides.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
            disabled={!loop && !canScrollPrev}
            aria-label="上一张"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
            disabled={!loop && !canScrollNext}
            aria-label="下一张"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* 分页圆点 */}
      {showPagination && slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                index === selectedIndex
                  ? "bg-white scale-110"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`跳转到第 ${index + 1} 张`}
            />
          ))}
        </div>
      )}
    </div>
  )

  if (isDesktop && fullWidth) {
    return (
      <div className="slideshow-wrapper py-4 w-screen relative left-1/2 right-1/2 -mx-[50vw]">
        {content}
      </div>
    )
  }

  return <div className="slideshow-wrapper content-container py-4">{content}</div>
}

function SlideContent({
  slide,
  overlayOpacity,
}: {
  slide: SlideData
  overlayOpacity: number
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const isVideo = slide.mediaType === "video" && slide.videoUrl
  const hasOverlay = !!(slide.title || slide.subtitle || slide.buttonText)

  const media = isVideo ? (
    <video
      ref={videoRef}
      src={slide.videoUrl}
      poster={slide.image}
      autoPlay
      muted
      loop
      playsInline
      className="w-full h-auto block"
    />
  ) : slide.image ? (
    <img
      src={slide.image}
      alt={slide.title || ""}
      className="w-full h-auto block"
      loading="lazy"
    />
  ) : (
    <div className="w-full h-48 bg-gray-200" />
  )

  const overlay = hasOverlay ? (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
      style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
    >
      {slide.title && (
        <h2 className="text-white text-2xl md:text-4xl lg:text-5xl font-bold mb-2 drop-shadow-lg">
          {slide.title}
        </h2>
      )}
      {slide.subtitle && (
        <p className="text-white/90 text-sm md:text-lg lg:text-xl mb-4 max-w-2xl drop-shadow">
          {slide.subtitle}
        </p>
      )}
      {slide.buttonText && (
        <a
          href={slide.buttonUrl || "#"}
          target={slide.buttonTarget || "_self"}
          rel={slide.buttonTarget === "_blank" ? "noopener noreferrer" : undefined}
          className="inline-block bg-white text-black px-6 py-2.5 rounded-md font-medium text-sm md:text-base hover:bg-gray-100 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {slide.buttonText}
        </a>
      )}
    </div>
  ) : null

  const inner = (
    <div className="relative">
      {media}
      {overlay}
    </div>
  )

  if (slide.link && !slide.buttonText) {
    return (
      <a
        href={slide.link}
        target={slide.linkTarget || "_self"}
        rel={slide.linkTarget === "_blank" ? "noopener noreferrer" : undefined}
        className="block"
      >
        {inner}
      </a>
    )
  }

  return inner
}
