export interface SlideData {
  id: string
  mediaType?: 'image' | 'video'
  image?: string
  videoUrl?: string
  link?: string
  linkTarget?: '_self' | '_blank'
  title?: string
  subtitle?: string
  buttonText?: string
  buttonUrl?: string
  buttonTarget?: '_self' | '_blank'
}

export interface SlideshowBlockData {
  slides: SlideData[]
  autoplay?: boolean
  autoplayDelay?: number
  loop?: boolean
  showNavigation?: boolean
  showPagination?: boolean
  effect?: 'slide' | 'fade'
  speed?: number
  fullWidth?: boolean
  overlayOpacity?: number
}

export interface SlideshowBlockProps {
  data: SlideshowBlockData
}
