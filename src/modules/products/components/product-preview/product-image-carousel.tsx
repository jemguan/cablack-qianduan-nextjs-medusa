"use client"

import React, { useCallback, useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Image from "next/image"
import { getImageUrl } from "@lib/util/image"
import { HttpTypes } from "@medusajs/types"
import ChevronLeft from "@modules/common/icons/chevron-left"
import ChevronRight from "@modules/common/icons/chevron-right"

// Check if mobile device
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

type ProductImageCarouselProps = {
  images: Array<{ id?: string; url: string }>
  productTitle?: string
  variantId?: string
}

const ProductImageCarousel: React.FC<ProductImageCarouselProps> = ({
  images,
  productTitle = "Product",
  variantId,
}) => {
  const isMobile = useIsMobile()
  
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
  })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [thumbnailsRef, thumbnailsApi] = useEmblaCarousel({
    containScroll: 'keepSnaps',
    dragFree: true,
  })

  const onSelect = useCallback(() => {
    if (!emblaApi || !thumbnailsApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    thumbnailsApi.scrollTo(emblaApi.selectedScrollSnap())
  }, [emblaApi, thumbnailsApi])

  const scrollTo = useCallback(
    (index: number) => {
      if (!emblaApi) return
      emblaApi.scrollTo(index)
    },
    [emblaApi]
  )

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect).on("reInit", onSelect)
    
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect)
    }
  }, [emblaApi, onSelect])

  // Reset carousel when variant changes or images change
  // Use a separate effect that only runs when emblaApi is ready
  useEffect(() => {
    if (!emblaApi || !thumbnailsApi || images.length === 0) {
      return
    }
    
    // Reinitialize carousel when images change
    emblaApi.reInit()
    thumbnailsApi.reInit()
    // Scroll to first image after reinit completes
    // Use requestAnimationFrame to ensure DOM is updated
    emblaApi.scrollTo(0, true) // true = jump (no animation)
    setSelectedIndex(0)
    
    requestAnimationFrame(() => {
      // Ensure we're at index 0 after reinit
      if (emblaApi.selectedScrollSnap() !== 0) {
        emblaApi.scrollTo(0)
      }
      // Scroll thumbnail to first position
      thumbnailsApi.scrollTo(0, true)
    })
  }, [variantId, images.length, images.map((img: any) => img?.id).join(','), emblaApi, thumbnailsApi])

  if (images.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Main Carousel */}
      <div className="relative overflow-hidden rounded-lg bg-ui-bg-subtle shadow-lg w-full">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {images.map((image, index) => (
              <div
                key={`${variantId || 'default'}-${image.id || index}`}
                className="relative aspect-square w-full flex-shrink-0"
              >
                <Image
                  src={getImageUrl(image.url)}
                  alt={`${productTitle} - Image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons - Hidden on mobile */}
        {images.length > 1 && !isMobile && (
          <>
            <button
              onClick={() => emblaApi?.scrollPrev()}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors shadow-lg"
              aria-label="Previous image"
            >
              <ChevronLeft size="20" />
            </button>
            <button
              onClick={() => emblaApi?.scrollNext()}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors shadow-lg"
              aria-label="Next image"
            >
              <ChevronRight size="20" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Carousel */}
      {images.length > 1 && (
        <div className="embla-thumbs">
          <div className="overflow-hidden" ref={thumbnailsRef}>
            <div className="flex">
              {images.map((image, index) => (
                <div
                  key={`${variantId || 'default'}-thumb-${image.id || index}`}
                  className="flex-shrink-0 pl-2 first:pl-0"
                  style={{ minWidth: '80px' }}
                >
                  <button
                    onClick={() => scrollTo(index)}
                    type="button"
                    className={`
                      relative w-20 h-20 rounded-md overflow-hidden border-2 transition-all hover:scale-105
                      ${selectedIndex === index
                        ? 'border-primary ring-2 ring-primary ring-offset-2 shadow-md'
                        : 'border-border hover:border-primary/50 hover:shadow-sm'
                      }
                    `}
                    aria-label={`Go to image ${index + 1}`}
                  >
                    <Image
                      src={getImageUrl(image.url)}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductImageCarousel

