"use client"

import React, {useState, useEffect, useRef, memo} from 'react';
import Link from 'next/link';
import {Button} from '@medusajs/ui';

// 简单的动画组件（不使用 framer-motion）
const MotionDiv = memo(React.forwardRef<HTMLDivElement, any>(({ 
  children, 
  initial, 
  animate, 
  transition,
  style,
  ...props 
}, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // 延迟显示以实现淡入效果
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, transition?.delay ? transition.delay * 1000 : 0);
    
    return () => clearTimeout(timer);
  }, [transition?.delay]);
  
  const opacity = isVisible ? (animate?.opacity ?? 1) : (initial?.opacity ?? 0);
  
  return (
    <div
      ref={ref}
      {...props}
      style={{
        ...style,
        opacity,
        transition: `opacity ${transition?.duration ?? 0.8}s ease-out`,
      }}
    >
      {children}
    </div>
  );
}));

const AnimatePresence = ({ children }: any) => <>{children}</>;
import LocalizedClientLink from '@modules/common/components/localized-client-link';
import ProductPreview from '@modules/products/components/product-preview';
import {getGlassClassName, getGlassStyle} from '@lib/ui/glass-effect/utils';
import {useHeaderHeight} from '@lib/hooks/useHeaderHeight';
import type {CollageHeroData, CollageModule} from './types';
import {DEFAULT_COLLAGE_HERO_CONFIG, DEFAULT_MODULE_CONFIG} from './config';
import type {HttpTypes} from '@medusajs/types';

// 简单的图标组件（如果没有 lucide-react）
const Volume2Icon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M6.343 6.343l4.243 4.243m0 0l4.243 4.243m-4.243-4.243L6.343 17.657m4.243-4.243l4.243-4.243" />
  </svg>
);

const VolumeXIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
  </svg>
);

/**
 * 桌面端 CollageHero 组件
 * 
 * 优化：添加组件级别的 Intersection Observer，当组件离开视窗时清理资源
 */
export function DesktopCollageHero({
  containerData,
  className = '',
  region,
}: {
  containerData: CollageHeroData;
  className?: string;
  region?: HttpTypes.StoreRegion;
}) {
  const {
    desktopBackgroundImage,
    desktopBackgroundVideo,
    backgroundImageAlt,
    backgroundVideoAutoplay = true,
    backgroundVideoLoop = true,
    backgroundVideoMuted = true,
    backgroundVideoPoster,
    modules,
    backgroundZIndex = DEFAULT_COLLAGE_HERO_CONFIG.backgroundZIndex || 0,
    desktopBlockHeight = '220vh',
    desktopOverlayStartVh = 100,
    desktopOverlayEndVh = 180,
  } = containerData;

  const [scrollState, setScrollState] = useState({
    overlayOpacity: 0,
    backgroundOpacity: 1,
  });
  const [isComponentVisible, setIsComponentVisible] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);
  const componentObserverRef = useRef<IntersectionObserver | null>(null);
  
  const headerHeight = useHeaderHeight();

  // 使用 Intersection Observer 检测组件是否在视窗内
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
            if (backgroundVideoRef.current && desktopBackgroundVideo) {
              const video = backgroundVideoRef.current;
              if (!video.src || video.src === '') {
                video.src = desktopBackgroundVideo;
              }
            }
            const backgroundImg = container.parentElement?.querySelector('img');
            if (backgroundImg && desktopBackgroundImage && (!backgroundImg.src || backgroundImg.src === '')) {
              backgroundImg.src = desktopBackgroundImage;
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
  }, [desktopBackgroundVideo, desktopBackgroundImage]);

  // 使用滚动监听，根据滚动位置控制遮罩和背景图片的显示
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

      const overlayStart = (desktopOverlayStartVh / 100) * windowHeight;
      const overlayEnd = (desktopOverlayEndVh / 100) * windowHeight;

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
  }, [isComponentVisible, headerHeight, desktopOverlayStartVh, desktopOverlayEndVh]);

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
        {desktopBackgroundVideo && desktopBackgroundVideo.trim() && isComponentVisible ? (
          <video
            ref={backgroundVideoRef}
            src={desktopBackgroundVideo}
            poster={backgroundVideoPoster && backgroundVideoPoster.trim() ? backgroundVideoPoster : undefined}
            autoPlay={backgroundVideoAutoplay && isComponentVisible}
            loop={backgroundVideoLoop}
            muted={backgroundVideoMuted}
            playsInline
            preload="metadata"
            aria-label={backgroundImageAlt || 'Collage Hero Background Video'}
            className="w-full h-full object-cover will-change-opacity"
            style={{
              opacity: scrollState.backgroundOpacity,
            }}
          >
            <track kind="captions" />
          </video>
        ) : desktopBackgroundImage && desktopBackgroundImage.trim() && isComponentVisible ? (
          <img
            src={desktopBackgroundImage}
            alt={backgroundImageAlt || 'Collage Hero Background'}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover will-change-opacity"
            style={{
              opacity: scrollState.backgroundOpacity,
            }}
          />
        ) : null}
        
        <div
          className="absolute inset-0 bg-background/80 will-change-opacity"
          style={{
            opacity: scrollState.overlayOpacity,
          }}
        />
      </div>

      <div ref={contentRef} className="relative z-0">
        <div className="relative w-full mx-auto py-24" style={{ minHeight: desktopBlockHeight }}>
          <AnimatePresence>
            {modules.map((module, index) => (
              <ModuleRenderer 
                key={module.id} 
                module={module} 
                index={index}
                overlayOpacity={scrollState.overlayOpacity} 
                products={containerData.products}
                isMobile={false}
                isComponentVisible={isComponentVisible}
                blockHeight={desktopBlockHeight}
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
  isMobile = false,
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

  if (!isMobile && module.desktopEnabled === false) {
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
        duration: 0.8, 
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

/**
 * 模块内容组件
 */
function ModuleContent({
  module,
  overlayOpacity = 0,
  products,
  isMobile = false,
  region,
}: {
  module: CollageModule;
  overlayOpacity?: number;
  products?: HttpTypes.StoreProduct[];
  isMobile?: boolean;
  region?: HttpTypes.StoreRegion;
}) {
  switch (module.type) {
    case 'image':
      return <ImageModuleComponent module={module} />;
    case 'collection':
      return <CollectionModuleComponent module={module} />;
    case 'video':
      return <VideoModuleComponent module={module} />;
    case 'product':
      return <ProductModuleComponent module={module} products={products} region={region} />;
    case 'text':
      return <TextModuleComponent module={module} overlayOpacity={overlayOpacity} isMobile={isMobile} />;
    default:
      return null;
  }
}

/**
 * 图片模块组件
 */
const ImageModuleComponent = memo(function ImageModuleComponent({
  module,
}: {
  module: Extract<CollageModule, {type: 'image'}>;
}) {
  const {imageUrl, alt, link, openInNewTab = DEFAULT_MODULE_CONFIG.image.openInNewTab} = module;

  const content = (
    <div className="cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl will-change-transform h-full w-full">
      <img
        src={imageUrl}
        alt={alt || 'Image Module'}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover rounded-lg shadow-lg"
      />
    </div>
  );

  if (link) {
    if (openInNewTab) {
      return (
        <a href={link} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      );
    }
    return <LocalizedClientLink href={link}>{content}</LocalizedClientLink>;
  }

  return content;
});

/**
 * 产品系列模块组件
 */
const CollectionModuleComponent = memo(function CollectionModuleComponent({
  module,
}: {
  module: Extract<CollageModule, {type: 'collection'}>;
}) {
  const {collectionHandle, title, imageUrl} = module;
  const collectionLink = `/collections/${collectionHandle}`;

  return (
    <LocalizedClientLink
      href={collectionLink}
      className="block cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl w-full h-full will-change-transform"
    >
      <div className={`relative w-full h-full rounded-lg ${getGlassClassName(true)}`} style={getGlassStyle(true)}>
        {imageUrl && (
          <img
            src={imageUrl}
            alt={title || 'Collection'}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover rounded-lg mb-2"
          />
        )}
        {title && (
          <h3 className="text-lg font-semibold text-foreground text-center drop-shadow-md">
            {title}
          </h3>
        )}
      </div>
    </LocalizedClientLink>
  );
});

/**
 * 视频模块组件
 */
const VideoModuleComponent = memo(function VideoModuleComponent({
  module,
}: {
  module: Extract<CollageModule, {type: 'video'}>;
}) {
  const {
    videoUrl,
    posterUrl,
    autoplay = DEFAULT_MODULE_CONFIG.video.autoplay,
    loop = DEFAULT_MODULE_CONFIG.video.loop,
    muted: initialMuted = DEFAULT_MODULE_CONFIG.video.muted,
    controls = DEFAULT_MODULE_CONFIG.video.controls,
  } = module;
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    
    if (!video || !container || typeof window === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (autoplay && video.paused) {
              video.play().catch(() => {
                // 静默处理播放错误
              });
            }
          } else {
            if (!video.paused) {
              video.pause();
            }
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: '50px',
      }
    );

    observer.observe(container);
    observerRef.current = observer;

    return () => {
      if (video) {
        video.pause();
        try {
          video.currentTime = 0;
          if ('load' in video && typeof video.load === 'function') {
            video.load();
          }
        } catch (e) {
          // 静默处理清理错误
        }
      }
      observer.disconnect();
      observerRef.current = null;
    };
  }, [autoplay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {
        // 静默处理播放错误
      });
    } else {
      video.pause();
    }
  };

  // 如果 videoUrl 为空或无效，不渲染视频元素
  if (!videoUrl || videoUrl.trim() === '') {
    return null;
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-lg shadow-lg w-full h-full group">
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl || undefined}
        loop={loop}
        muted={isMuted}
        controls={controls}
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
      >
        <track kind="captions" />
        您的浏览器不支持视频播放。
      </video>
      
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <button
          onClick={toggleMute}
          className="p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-colors"
          aria-label={isMuted ? '取消静音' : '静音'}
        >
          {isMuted ? (
            <VolumeXIcon />
          ) : (
            <Volume2Icon />
          )}
        </button>
        
        <button
          onClick={togglePlayPause}
          className="p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-colors"
          aria-label={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? (
            <PauseIcon />
          ) : (
            <PlayIcon />
          )}
        </button>
      </div>
    </div>
  );
});

/**
 * 主推产品模块组件
 */
function ProductModuleComponent({
  module,
  products,
  region,
}: {
  module: Extract<CollageModule, {type: 'product'}>;
  products?: HttpTypes.StoreProduct[];
  region?: HttpTypes.StoreRegion;
}) {
  const {productId} = module;

  if (!productId || productId.trim() === '') {
    return (
      <div className={`w-full h-full flex items-center justify-center p-4 rounded-lg ${getGlassClassName(true)}`} style={getGlassStyle(true)}>
        <div className="text-sm text-gray-500 text-center">请在产品模块配置中设置产品 ID</div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className={`w-full h-full flex items-center justify-center p-4 rounded-lg ${getGlassClassName(true)}`} style={getGlassStyle(true)}>
        <div className="text-sm text-gray-500 text-center">产品数据加载中...</div>
      </div>
    );
  }

  const product = products.find((p) => p.id === productId || p.handle === productId);

  if (!product) {
    return (
      <div className={`w-full h-full flex items-center justify-center p-4 rounded-lg ${getGlassClassName(true)}`} style={getGlassStyle(true)}>
        <div className="text-sm text-gray-500 text-center">
          <div>未找到产品 ID: {productId}</div>
        </div>
      </div>
    );
  }

  if (!region) {
    return (
      <div className={`w-full h-full flex items-center justify-center p-4 rounded-lg ${getGlassClassName(true)}`} style={getGlassStyle(true)}>
        <div className="text-sm text-gray-500 text-center">区域信息缺失</div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full rounded-lg ${getGlassClassName(true)}`} style={getGlassStyle(true)}>
      <ProductPreview product={product} region={region} />
    </div>
  );
}

/**
 * 文字模块组件
 */
function TextModuleComponent({
  module,
  overlayOpacity = 0,
  isMobile = false,
}: {
  module: Extract<CollageModule, {type: 'text'}>;
  overlayOpacity?: number;
  isMobile?: boolean;
}) {
  const {
    title,
    subtitle,
    content,
    textAlign = 'center',
    titleColor = 'text-foreground',
    subtitleColor = 'text-muted-foreground',
    contentColor = 'text-foreground',
    backgroundColor,
    link,
    openInNewTab = false,
    showButton = false,
    buttonText = '了解更多',
    buttonLink,
    buttonOpenInNewTab = false,
    desktopTitleSize,
    desktopSubtitleSize,
    desktopContentSize,
    mobileTitleSize,
    mobileSubtitleSize,
    mobileContentSize,
  } = module;
  const position = isMobile 
    ? (module.mobilePosition || module.position || {})
    : (module.position || {});

  const textAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[textAlign];

  const textOpacity = Math.max(0, 1 - overlayOpacity);

  const buttonElement = showButton && buttonLink ? (
    <div className={`mt-4 ${textAlign === 'center' ? 'flex justify-center' : textAlign === 'right' ? 'flex justify-end' : 'flex justify-start'}`}>
      {buttonOpenInNewTab ? (
        <Button asChild variant="primary">
          <a href={buttonLink} target="_blank" rel="noopener noreferrer">
            {buttonText}
          </a>
        </Button>
      ) : (
        <Button asChild variant="primary">
          <LocalizedClientLink href={buttonLink}>
            {buttonText}
          </LocalizedClientLink>
        </Button>
      )}
    </div>
  ) : null;

  const backgroundClass = backgroundColor 
    ? `${backgroundColor} rounded-lg p-6 ${textAlignClass} transition-opacity duration-300`
    : `${getGlassClassName(true)} rounded-lg p-6 ${textAlignClass} transition-opacity duration-300`;
  
  const hasExplicitHeight = position.height && position.height !== 'auto';
  const backgroundStyle = backgroundColor
    ? { 
        width: '100%', 
        ...(hasExplicitHeight && { minHeight: '100%' })
      }
    : { 
        width: '100%', 
        ...(hasExplicitHeight && { minHeight: '100%' }), 
        ...getGlassStyle(true) 
      };

  const titleSize = isMobile 
    ? (mobileTitleSize || desktopTitleSize || "text-xl")
    : (desktopTitleSize || "text-2xl");
  const subtitleSize = isMobile
    ? (mobileSubtitleSize || desktopSubtitleSize || "text-base")
    : (desktopSubtitleSize || "text-lg");
  const contentSize = isMobile
    ? (mobileContentSize || desktopContentSize || "text-sm")
    : (desktopContentSize || "text-base");

  const textContent = (
    <div
      className={backgroundClass}
      style={backgroundStyle}
    >
      {title && (
        <h2 className={`${titleSize} font-bold mb-2 ${titleColor}`}>{title}</h2>
      )}
      {subtitle && (
        <h3 className={`${subtitleSize} font-semibold mb-3 ${subtitleColor}`}>
          {subtitle}
        </h3>
      )}
      {content && (
        <p className={`${contentSize} leading-relaxed ${contentColor}`}>{content}</p>
      )}
      {buttonElement}
    </div>
  );

  const textModuleStyle: React.CSSProperties = {
    opacity: textOpacity,
    ...(textOpacity <= 0 && { pointerEvents: 'none' as const }),
  };

  if (link) {
    if (openInNewTab) {
      return (
        <a href={link} target="_blank" rel="noopener noreferrer" className="block" style={textModuleStyle}>
          {textContent}
        </a>
      );
    }
    return <LocalizedClientLink href={link} style={textModuleStyle}>{textContent}</LocalizedClientLink>;
  }

  return <div style={textModuleStyle}>{textContent}</div>;
}

