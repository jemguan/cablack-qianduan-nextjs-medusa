/**
 * CountdownBanner Block Handler
 * 处理倒计时横幅块
 */

import type { BlockBase, BlockConfig } from './types';

export type ContentPosition = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface CountdownBannerData {
  endTime: string;
  showTitle: boolean;
  title: string;
  showSubtitle: boolean;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  buttonLinkTarget: string;
  backgroundColor: string;
  backgroundImage: string;
  backgroundImageMobile: string;
  textColor: string;
  buttonBgColor: string;
  buttonTextColor: string;
  fullWidth: boolean;
  contentPosition: ContentPosition;
  paddingY: number;
}

export function handleCountdownBannerBlock(
  block: BlockBase,
  blockConfig: Record<string, any>
): BlockConfig | null {
  const data: CountdownBannerData = {
    endTime: blockConfig.endTime || '',
    showTitle: blockConfig.showTitle !== false,
    title: blockConfig.title || '',
    showSubtitle: blockConfig.showSubtitle === true,
    subtitle: blockConfig.subtitle || '',
    buttonText: blockConfig.buttonText || 'PRE-ORDER NOW!',
    buttonLink: blockConfig.buttonLink || '',
    buttonLinkTarget: blockConfig.buttonLinkTarget || '_self',
    backgroundColor: blockConfig.backgroundColor || '#FFF9E6',
    backgroundImage: blockConfig.backgroundImage || '',
    backgroundImageMobile: blockConfig.backgroundImageMobile || '',
    textColor: blockConfig.textColor || '#000000',
    buttonBgColor: blockConfig.buttonBgColor || '#C2185B',
    buttonTextColor: blockConfig.buttonTextColor || '#FFFFFF',
    fullWidth: blockConfig.fullWidth === true,
    contentPosition: blockConfig.contentPosition || 'center',
    paddingY: typeof blockConfig.paddingY === 'number' ? blockConfig.paddingY : 16,
  };

  return {
    id: `countdown-banner-${block.id}`,
    type: block.type,
    enabled: block.enabled,
    order: block.order,
    config: blockConfig,
    componentName: 'CountdownBannerBlock',
    props: {
      data,
    },
  };
}
