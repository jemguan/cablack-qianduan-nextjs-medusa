"use client"

import { useState, useEffect, useRef } from "react"

interface ScrollState {
  overlayOpacity: number
  backgroundOpacity: number
}

interface UseScrollOpacityProps {
  contentRef: React.RefObject<HTMLDivElement | null>
  isComponentVisible: boolean
  headerHeight: number
  overlayStartVh: number
  overlayEndVh: number
}

/**
 * 滚动透明度 Hook
 * 根据滚动位置计算遮罩层和背景的透明度
 */
export function useScrollOpacity({
  contentRef,
  isComponentVisible,
  headerHeight,
  overlayStartVh,
  overlayEndVh,
}: UseScrollOpacityProps): ScrollState {
  const [scrollState, setScrollState] = useState<ScrollState>({
    overlayOpacity: 0,
    backgroundOpacity: 1,
  })
  const rafIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isComponentVisible) {
      setScrollState({
        overlayOpacity: 0,
        backgroundOpacity: 1,
      })
      return
    }

    let isMounted = true
    let ticking = false
    let lastScrollY = window.scrollY
    let isInitialized = false

    const handleScroll = () => {
      if (!isMounted || !isComponentVisible) {
        if (isMounted) {
          setScrollState({
            overlayOpacity: 0,
            backgroundOpacity: 1,
          })
        }
        return
      }

      const scrollY = window.scrollY
      const windowHeight = window.innerHeight

      const container = contentRef.current
      if (!container) {
        return
      }

      const containerRect = container.getBoundingClientRect()
      const containerTop = containerRect.top + scrollY
      const relativeScrollY = scrollY - containerTop + headerHeight

      if (scrollY === lastScrollY && isInitialized) {
        return
      }
      lastScrollY = scrollY
      isInitialized = true

      const overlayStart = (overlayStartVh / 100) * windowHeight
      const overlayEnd = (overlayEndVh / 100) * windowHeight

      let overlayOpacityValue = 0

      if (containerRect.bottom < 0 || containerRect.top > windowHeight) {
        overlayOpacityValue = 0
      } else if (relativeScrollY >= overlayStart) {
        overlayOpacityValue =
          relativeScrollY >= overlayEnd
            ? 1
            : (relativeScrollY - overlayStart) / (overlayEnd - overlayStart)
      }

      const backgroundOpacityValue = Math.max(0, 1 - overlayOpacityValue)

      if (isMounted && isComponentVisible) {
        setScrollState((prevState) => {
          const opacityTolerance = 0.001

          if (
            Math.abs(prevState.overlayOpacity - overlayOpacityValue) <
              opacityTolerance &&
            Math.abs(prevState.backgroundOpacity - backgroundOpacityValue) <
              opacityTolerance
          ) {
            return prevState
          }

          return {
            overlayOpacity: overlayOpacityValue,
            backgroundOpacity: backgroundOpacityValue,
          }
        })
      }
    }

    if (isComponentVisible) {
      handleScroll()
    }

    const onScroll = () => {
      if (!isMounted || !isComponentVisible) {
        return
      }

      const currentScrollY = window.scrollY
      if (currentScrollY === lastScrollY && isInitialized) {
        return
      }

      if (!ticking) {
        ticking = true
        rafIdRef.current = window.requestAnimationFrame(() => {
          ticking = false
          if (isMounted && isComponentVisible) {
            handleScroll()
          }
        })
      }
    }

    const scrollOptions: AddEventListenerOptions = { passive: true }
    window.addEventListener("scroll", onScroll, scrollOptions)

    return () => {
      isMounted = false
      ticking = false
      window.removeEventListener("scroll", onScroll, scrollOptions)
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [isComponentVisible, headerHeight, overlayStartVh, overlayEndVh, contentRef])

  return scrollState
}
