/**
 * Slideshow Block Handler
 * 处理幻灯片块
 */

import type { SlideshowBlockData } from '../../components/slideshow-block/types';
import type { BlockBase, BlockConfig } from './types';
import { generateUniqueId, safeParseInt } from './types';

function processImageUrl(image: any): string {
  if (typeof image === 'string') return image;
  if (image?.desktop) return image.desktop;
  return '';
}

export function handleSlideshowBlock(
  block: BlockBase,
  blockConfig: Record<string, any>
): BlockConfig | null {
  const slideshowData: SlideshowBlockData = {
    slides: (blockConfig.slides || []).map((slide: any) => ({
      id: slide.id || generateUniqueId('slide'),
      mediaType: slide.mediaType || 'image',
      image: processImageUrl(slide.image),
      videoUrl: slide.videoUrl || '',
      link: slide.link,
      linkTarget: slide.linkTarget || '_self',
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      buttonText: slide.buttonText || '',
      buttonUrl: slide.buttonUrl || '',
      buttonTarget: slide.buttonTarget || '_self',
    })),
    autoplay: blockConfig.autoplay !== false,
    autoplayDelay: safeParseInt(blockConfig.autoplayDelay, 5000),
    loop: blockConfig.loop !== false,
    showNavigation: blockConfig.showNavigation !== false,
    showPagination: blockConfig.showPagination !== false,
    effect: blockConfig.effect || 'slide',
    speed: safeParseInt(blockConfig.speed, 500),
    fullWidth: blockConfig.fullWidth === true,
    overlayOpacity: typeof blockConfig.overlayOpacity === 'number' ? blockConfig.overlayOpacity : 0.3,
  };

  return {
    id: `slideshow-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: 'SlideshowBlock',
    props: {
      data: slideshowData,
    },
  };
}
