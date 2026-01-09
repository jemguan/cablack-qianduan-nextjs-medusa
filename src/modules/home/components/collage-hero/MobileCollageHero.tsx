"use client"

import React, {useState, useEffect, useRef} from 'react';
import {useRouter} from 'next/navigation';
import {getGlassClassName, getGlassStyle} from '@lib/ui/glass-effect/utils';
import {useHeaderHeight} from '@lib/hooks/useHeaderHeight';
import type {CollageHeroData, CollageModule} from './types';
import {DEFAULT_COLLAGE_HERO_CONFIG} from './config';
import type {HttpTypes} from '@medusajs/types';

// 从共享模块导入
import {
  MotionDiv,
  AnimatePresence,
  ModuleContent,
} from './shared';

/**
 * 移动端 CollageHero 组件
 * 
 * 优化：添加组件级别的 Intersection Observer，当组件离开视窗时清理资源
 */
export function MobileCollageHero({
  containerData,
  className = '',
  region,
}: {
  containerData: CollageHeroData;
  className?: string;
  region?: HttpTypes.StoreRegion;
}) {
  const {
    mobileBackgroundImage,
    desktopBackgroundImage,
    mobileBackgroundVideo,
    desktopBackgroundVideo,
    backgroundImageAlt,
    backgroundVideoAutoplay = true,
    backgroundVideoLoop = true,
    backgroundVideoMuted = true,
    backgroundVideoPoster,
    modules,
    backgroundZIndex = DEFAULT_COLLAGE_HERO_CONFIG.backgroundZIndex || 0,
    mobileBlockHeight = '220vh',
    mobileOverlayStartVh = 100,
    mobileOverlayEndVh = 180,
    mobileBackgroundImageOpacity = 1,
    desktopBackgroundImageOpacity = 1,
  } = containerData;

  // 移动端优先使用移动端资源，如果没有则使用桌面端资源
  const backgroundVideo = mobileBackgroundVideo || desktopBackgroundVideo;
  const backgroundImage = mobileBackgroundImage || desktopBackgroundImage;
  // 移动端优先使用移动端透明度，如果没有则使用桌面端透明度
  const backgroundImageOpacity = mobileBackgroundImageOpacity !== undefined 
    ? mobileBackgroundImageOpacity 
    : desktopBackgroundImageOpacity;

  const [scrollState, setScrollState] = useState({
    overlayOpacity: 0,
    backgroundOpacity: 1,
  });
  const [isComponentVisible, setIsComponentVisible] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);
  const componentObserverRef = useRef<IntersectionObserver | null>(null);
  const router = useRouter();
  
  const headerHeight = useHeaderHeight();

  // 预取所有模块中的链接，提升点击跳转速度
  useEffect(() => {
    if (!modules || modules.length === 0) return;

    const linksToPreFetch: string[] = [];

    for (const module of modules) {
      if (module.type === 'image' && module.link && !module.openInNewTab) {
        linksToPreFetch.push(module.link);
      } else if (module.type === 'collection' && module.collectionHandle) {
        linksToPreFetch.push(`/collections/${module.collectionHandle}`);
      } else if (module.type === 'text') {
        if (module.link && !module.openInNewTab) {
          linksToPreFetch.push(module.link);
        }
        if (module.buttonLink && !module.buttonOpenInNewTab) {
          linksToPreFetch.push(module.buttonLink);
        }
      } else if (module.type === 'product' && module.productId) {
        // 产品链接会在产品详情中跳转
        const product = containerData.products?.find(p => p.id === module.productId);
        if (product?.handle) {
          linksToPreFetch.push(`/products/${product.handle}`);
        }
      }
    }

    // 去重并预取
    const uniqueLinks = [...new Set(linksToPreFetch)];
    uniqueLinks.forEach(link => {
      router.prefetch(link);
    });
  }, [modules, containerData.products, router]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container || typeof window === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isVisible = entry.isIntersecting;
          setIsComponentVisible(isVisible);

          if (isVisible) {
            if (backgroundVideoRef.current && backgroundVideo) {
              const video = backgroundVideoRef.current;
              if (!video.src || video.src === '') {
                video.src = backgroundVideo;
              }
            }
            const backgroundImg = container.parentElement?.querySelector('img');
            if (backgroundImg && backgroundImage && (!backgroundImg.src || backgroundImg.src === '')) {
              backgroundImg.src = backgroundImage;
            }
          } else {
            if (backgroundVideoRef.current) {
              const video = backgroundVideoRef.current;
              if (!video.paused) {
                video.pause();
              }
              try {
                video.currentTime = 0;
                if ('load' in video && typeof video.load === 'function') {
                  video.load();
                }
                video.src = '';
                video.removeAttribute('src');
              } catch {
                // 某些浏览器可能不支持
              }
            }

            const backgroundImg = container.parentElement?.querySelector('img');
            if (backgroundImg && backgroundImg.src) {
              backgroundImg.src = '';
              backgroundImg.removeAttribute('src');
            }
          }
        });
      },
      {
        threshold: 0,
        rootMargin: '-200px',
      }
    );

    observer.observe(container);
    componentObserverRef.current = observer;

    return () => {
      observer.disconnect();
      componentObserverRef.current = null;
    };
  }, [backgroundVideo, backgroundImage]);

  useEffect(() => {
    if (!isComponentVisible) {
      setScrollState({
        overlayOpacity: 0,
        backgroundOpacity: 1,
      });
      return;
    }

    let isMounted = true;
    let ticking = false;
    let lastScrollY = window.scrollY;
    let isInitialized = false;

    const handleScroll = () => {
      if (!isMounted || !isComponentVisible) {
        if (isMounted) {
          setScrollState({
            overlayOpacity: 0,
            backgroundOpacity: 1,
          });
        }
        return;
      }

      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      const container = contentRef.current;
      if (!container) {
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const containerTop = containerRect.top + scrollY;
      const relativeScrollY = scrollY - containerTop + headerHeight;

      if (scrollY === lastScrollY && isInitialized) {
        return;
      }
      lastScrollY = scrollY;
      isInitialized = true;

      const overlayStart = (mobileOverlayStartVh / 100) * windowHeight;
      const overlayEnd = (mobileOverlayEndVh / 100) * windowHeight;

      let overlayOpacityValue = 0;
      
      if (containerRect.bottom < 0 || containerRect.top > windowHeight) {
        overlayOpacityValue = 0;
      } else if (relativeScrollY >= overlayStart) {
        overlayOpacityValue = relativeScrollY >= overlayEnd 
          ? 1 
          : (relativeScrollY - overlayStart) / (overlayEnd - overlayStart);
      }

      const backgroundOpacityValue = Math.max(0, 1 - overlayOpacityValue);

      if (isMounted && isComponentVisible) {
        setScrollState((prevState) => {
          const opacityTolerance = 0.001;
          
          if (
            Math.abs(prevState.overlayOpacity - overlayOpacityValue) < opacityTolerance &&
            Math.abs(prevState.backgroundOpacity - backgroundOpacityValue) < opacityTolerance
          ) {
            return prevState;
          }
          
          return {
            overlayOpacity: overlayOpacityValue,
            backgroundOpacity: backgroundOpacityValue,
          };
        });
      }
    };

    if (isComponentVisible) {
      handleScroll();
    }

    const onScroll = () => {
      if (!isMounted || !isComponentVisible) {
        return;
      }

      const currentScrollY = window.scrollY;
      if (currentScrollY === lastScrollY && isInitialized) {
        return;
      }

      if (!ticking) {
        ticking = true;
        rafIdRef.current = window.requestAnimationFrame(() => {
          ticking = false;
          if (isMounted && isComponentVisible) {
            handleScroll();
          }
        });
      }
    };

    const scrollOptions: AddEventListenerOptions = { passive: true };
    window.addEventListener('scroll', onScroll, scrollOptions);

    return () => {
      isMounted = false;
      ticking = false;
      window.removeEventListener('scroll', onScroll, scrollOptions);
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isComponentVisible, headerHeight, mobileOverlayStartVh, mobileOverlayEndVh]);

  return (
    <div className={`relative ${className}`}>
      <div
        className="fixed left-0 right-0 w-full"
        style={{
          top: `${headerHeight}px`,
          height: `calc(100vh - ${headerHeight}px)`,
          zIndex: backgroundZIndex ?? -1,
        }}
      >
        {backgroundVideo && backgroundVideo.trim() && isComponentVisible ? (
          <video
            ref={backgroundVideoRef}
            src={backgroundVideo}
            poster={backgroundVideoPoster && backgroundVideoPoster.trim() ? backgroundVideoPoster : undefined}
            autoPlay={backgroundVideoAutoplay && isComponentVisible}
            loop={backgroundVideoLoop}
            muted={backgroundVideoMuted}
            playsInline
            preload="metadata"
            aria-label={backgroundImageAlt || 'Collage Hero Background Video'}
            className="w-full h-full object-cover will-change-opacity"
            style={{
              opacity: scrollState.backgroundOpacity * backgroundImageOpacity,
            }}
          >
            <track kind="captions" />
          </video>
        ) : backgroundImage && backgroundImage.trim() && isComponentVisible ? (
          <img
            src={backgroundImage}
            alt={backgroundImageAlt || 'Collage Hero Background'}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="w-full h-full object-cover will-change-opacity"
            style={{
              opacity: scrollState.backgroundOpacity * backgroundImageOpacity,
            }}
          />
        ) : null}
        
        <div
          className="absolute bg-background/80 will-change-opacity"
          style={{
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: scrollState.overlayOpacity,
          }}
        />
      </div>

      <div ref={contentRef} className="relative z-0">
        <div className="relative w-full mx-auto py-16" style={{ minHeight: mobileBlockHeight }}>
          <AnimatePresence>
            {modules.map((module, index) => (
              <ModuleRenderer 
                key={module.id} 
                module={module} 
                index={index}
                overlayOpacity={scrollState.overlayOpacity} 
                products={containerData.products}
                isMobile={true}
                isComponentVisible={isComponentVisible}
                blockHeight={mobileBlockHeight}
                region={region}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/**
 * 模块渲染器（带懒加载）
 */
function ModuleRenderer({
  module,
  index,
  overlayOpacity = 0,
  products,
  isMobile = true,
  isComponentVisible = true,
  blockHeight = '220vh',
  region,
}: {
  module: CollageModule;
  index: number;
  overlayOpacity?: number;
  products?: HttpTypes.StoreProduct[];
  isMobile?: boolean;
  isComponentVisible?: boolean;
  blockHeight?: string;
  region?: HttpTypes.StoreRegion;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === 'undefined') {
      return;
    }

    if (!isComponentVisible) {
      return;
    }

    const position = isMobile 
      ? (module.mobilePosition || module.position || {})
      : (module.position || {});
    
    const topValue = position.top;
    if (topValue && typeof topValue === 'string') {
      const topVh = parseFloat(topValue.replace('vh', ''));
      if (!isNaN(topVh) && topVh < 100) {
        setIsVisible(true);
        return;
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px',
        threshold: 0.01,
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [module, isMobile, isComponentVisible]);

  const rawPosition = isMobile 
    ? (module.mobilePosition || module.position || {})
    : (module.position || {});
  
  const position = {
    ...(rawPosition.top !== undefined ? { top: rawPosition.top } : {}),
    ...(rawPosition.left !== undefined ? { left: rawPosition.left } : {}),
    ...(rawPosition.right !== undefined ? { right: rawPosition.right } : {}),
    ...(rawPosition.bottom !== undefined ? { bottom: rawPosition.bottom } : {}),
    ...(rawPosition.width !== undefined ? { width: rawPosition.width } : {}),
    ...(rawPosition.height !== undefined ? { height: rawPosition.height } : {}),
    ...(rawPosition.transform !== undefined ? { transform: rawPosition.transform } : {}),
  };
    
  const isTextModule = module.type === 'text';
  const isImageModule = module.type === 'image';
  const isCollectionModule = module.type === 'collection';
  const isVideoModule = module.type === 'video';
  const isProductModule = module.type === 'product';
  const textModuleSticky = isTextModule && (module.stickyOnHero !== false);
  const moduleZIndex = isTextModule ? 5 : 10;
  const modulePosition = textModuleSticky ? 'fixed' as const : 'absolute' as const;

  const defaultPosition = module.type === 'text' 
    ? {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: isMobile ? '90%' : '600px',
      }
    : {};

  const hasTop = position.top !== undefined && position.top !== null && position.top !== '';
  const hasLeft = position.left !== undefined && position.left !== null && position.left !== '';
  const shouldUseCenterTransform = (isTextModule || isImageModule || isCollectionModule || isVideoModule || isProductModule) && 
    !position.transform && 
    (hasTop || hasLeft || (!hasTop && !hasLeft && defaultPosition.transform));

  const finalTop = hasTop ? position.top : (defaultPosition.top || 'auto');
  const finalLeft = hasLeft ? position.left : (defaultPosition.left || 'auto');

  if (!isComponentVisible) {
    return null;
  }

  if (isMobile && module.mobileEnabled === false) {
    return null;
  }

  const style: Record<string, string | number> = {
    position: modulePosition,
    width: position.width || defaultPosition.width || 'auto',
    height: position.height || 'auto',
    zIndex: moduleZIndex,
  };
  
  if (position.transform) {
    style.transform = position.transform;
  }
  
  if (finalTop && finalTop !== 'auto') {
    style.top = finalTop;
  }
  if (finalLeft && finalLeft !== 'auto') {
    style.left = finalLeft;
  }
  
  if ((!finalTop || finalTop === 'auto') && position.right !== undefined && position.right !== null && position.right !== '') {
    style.right = position.right;
  }
  if ((!finalTop || finalTop === 'auto') && position.bottom !== undefined && position.bottom !== null && position.bottom !== '') {
    style.bottom = position.bottom;
  }
  
  delete (style as any).inset;

  // 处理 transform：如果 style 中已有 transform，需要合并
  let finalTransform = style.transform || '';
  if (shouldUseCenterTransform) {
    const centerTransform = `translate(-50%, -50%)`;
    if (finalTransform) {
      finalTransform = `${centerTransform} ${finalTransform}`;
    } else {
      finalTransform = centerTransform;
    }
  }
  
  const finalStyle = {
    ...style,
    ...(finalTransform ? { transform: finalTransform } : {}),
  };
  
  return (
    <MotionDiv 
      ref={containerRef} 
      style={finalStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
      }}
    >
      {isVisible ? (
        <ModuleContent
          module={module}
          overlayOpacity={overlayOpacity}
          products={products}
          isMobile={isMobile}
          region={region}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', minHeight: '100px' }} />
      )}
    </MotionDiv>
  );
}
