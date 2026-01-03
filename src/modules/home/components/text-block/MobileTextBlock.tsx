"use client"

import {useState, useRef, useEffect} from 'react';
import {Button} from '@/components/ui/button';
import ChevronDown from '@modules/common/icons/chevron-down';
import ChevronUp from '@modules/common/icons/chevron-up';
import type {TextBlockProps, TextModuleData} from './types';
import {DEFAULT_TEXT_BLOCK_CONFIG} from './config';
import {sanitizeHtml} from '@lib/util/sanitize';

/**
 * 获取颜色样式
 */
function getColorStyle(colorValue: string) {
  // 如果是渐变色
  if (colorValue.includes('linear-gradient') || colorValue.includes('radial-gradient')) {
    return {
      background: colorValue,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    };
  }

  // 如果是纯色值（hex, rgb, hsl）
  if (colorValue.startsWith('#') || colorValue.startsWith('rgb') || colorValue.startsWith('hsl')) {
    return {
      color: colorValue,
    };
  }

  // 如果是 Tailwind 类名，返回空对象（由 className 处理）
  return {};
}

/**
 * 获取颜色类名（只包含非颜色相关的类名）
 */
function getColorClassName(colorValue: string) {
  // 如果是 Tailwind 类名，返回它
  if (!colorValue.includes('linear-gradient') &&
      !colorValue.includes('radial-gradient') &&
      !colorValue.startsWith('#') &&
      !colorValue.startsWith('rgb') &&
      !colorValue.startsWith('hsl')) {
    return colorValue;
  }

  // 否则返回空字符串（颜色由 style 处理）
  return '';
}

/**
 * 渲染内容（支持文本和HTML模式）
 */
function renderContent(content: string, contentMode: 'text' | 'html' = 'text') {
  if (contentMode === 'html') {
    // Sanitize HTML content to prevent XSS attacks
    return <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />;
  }
  return content;
}

/**
 * 单个文字模块组件（移动端）
 */
function TextModule({module}: {module: TextModuleData}) {
  const {
    title,
    titleColor = DEFAULT_TEXT_BLOCK_CONFIG.titleColor,
    subtitle,
    subtitleColor = DEFAULT_TEXT_BLOCK_CONFIG.subtitleColor,
    content,
    contentMode = 'text',
    mobileCollapsedLines = DEFAULT_TEXT_BLOCK_CONFIG.mobileCollapsedLines,
    expandButtonText = DEFAULT_TEXT_BLOCK_CONFIG.expandButtonText,
    collapseButtonText = DEFAULT_TEXT_BLOCK_CONFIG.collapseButtonText,
    textAlign = DEFAULT_TEXT_BLOCK_CONFIG.textAlign,
    showOnMobile = DEFAULT_TEXT_BLOCK_CONFIG.showOnMobile,
  } = module;

  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  // 检查内容是否超过指定行数
  useEffect(() => {
    if (contentRef.current && showOnMobile) {
      const lineHeight = parseInt(
        window.getComputedStyle(contentRef.current).lineHeight,
      );
      const maxHeight = lineHeight * mobileCollapsedLines;
      const actualHeight = contentRef.current.scrollHeight;

      setNeedsExpansion(actualHeight > maxHeight);
    }
  }, [content, mobileCollapsedLines, showOnMobile]);

  // 如果移动端不可见，直接返回 null
  if (!showOnMobile) {
    return null;
  }

  // 如果没有标题、副标题和内容，且内容为空，则不渲染
  if (!title && !subtitle && (!content || content.trim() === '')) {
    return null;
  }

  // 文本对齐类名映射
  const textAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[textAlign];

  return (
    <div className={`w-full mb-6 ${textAlignClass}`}>
      {/* 标题 */}
      {title && (
        <h2
          className={`text-2xl font-bold mb-2 ${getColorClassName(titleColor)}`}
          style={getColorStyle(titleColor)}
        >
          {title}
        </h2>
      )}

      {/* 副标题 */}
      {subtitle && (
        <h3
          className={`text-lg mb-4 ${getColorClassName(subtitleColor)}`}
          style={getColorStyle(subtitleColor)}
        >
          {subtitle}
        </h3>
      )}

      {/* 内容区域 */}
      <div className="relative">
        <p
          ref={contentRef}
          className="text-sm leading-relaxed text-foreground transition-all duration-300"
          style={
            !isExpanded && needsExpansion
              ? {
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  WebkitLineClamp: mobileCollapsedLines,
                }
              : {}
          }
        >
          {renderContent(content, contentMode)}
        </p>

        {/* 渐变遮罩（仅在折叠状态显示） */}
        {!isExpanded && needsExpansion && (
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        )}
      </div>

      {/* 展开/收起按钮 */}
      {needsExpansion && (
        <div className={`mt-3 ${textAlign === 'center' ? 'flex justify-center' : textAlign === 'right' ? 'flex justify-end' : ''}`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2 text-primary hover:text-primary/80"
          >
            {isExpanded ? collapseButtonText : expandButtonText}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * 移动端文字 Block 组件
 * 用于在移动端展示多个可折叠的文字模块，支持网格布局
 */
export function MobileTextBlock({data}: TextBlockProps) {
  const {modules, mobileGridCols = 1} = data;

  if (!modules || modules.length === 0) {
    return (
      <div className="w-full py-8 text-center text-muted-foreground">
        暂无文字内容
      </div>
    );
  }

  // 获取可见的模块
  const visibleModules = modules.filter(module => module.showOnMobile !== false);

  // 使用CSS Grid布局
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${mobileGridCols}, 1fr)`,
    gap: '1rem', // 16px gap for mobile
    width: '100%',
  };

  return (
    <div style={gridStyle}>
      {visibleModules.map((module) => (
        <TextModule key={module.id} module={module} />
      ))}
    </div>
  );
}

