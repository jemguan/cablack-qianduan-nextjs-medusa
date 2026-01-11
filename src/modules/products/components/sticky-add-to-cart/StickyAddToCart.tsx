"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Transition } from '@headlessui/react';
import { useResponsiveRender } from '@lib/hooks/useResponsiveRender';
import { useVariantSelection } from '@modules/products/contexts/variant-selection-context';
import { addToCart } from '@lib/data/cart';
import { useParams } from 'next/navigation';
import { isElementScrolledOut } from './utils';
import { STICKY_ADD_TO_CART_CONFIG } from './config';
import { DesktopStickyAddToCart } from './DesktopStickyAddToCart';
import { MobileStickyAddToCart } from './MobileStickyAddToCart';
import type { StickyAddToCartProps } from './types';

/**
 * 粘性购物栏主组件
 * 当产品信息滚动出视口时显示在屏幕底部
 * 响应式设计：桌面端和移动端不同布局
 * 支持用户手动关闭，关闭后当前会话中不再显示
 *
 * 优化：只在客户端根据屏幕尺寸渲染对应组件，避免同时渲染两个组件浪费内存
 */
export function StickyAddToCart({
  product,
  region,
  triggerRef,
  mobileTriggerRef,
  customer,
  loyaltyAccount,
  membershipProductIds,
}: StickyAddToCartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const { isDesktop, isHydrated } = useResponsiveRender();
  const { selectedVariant } = useVariantSelection();
  const countryCode = useParams().countryCode as string;

  // 获取当前应该使用的 ref（移动端或桌面端）
  const currentTriggerRef = isDesktop ? triggerRef : (mobileTriggerRef || triggerRef);

  // 处理滚动事件
  const handleScroll = useCallback(() => {
    // 如果用户已关闭，不再显示
    if (isClosed) {
      setIsVisible(false);
      return;
    }

    const ref = currentTriggerRef;
    if (ref?.current) {
      // 检查触发元素是否滚动出视口
      const triggerScrolledOut = isElementScrolledOut(ref.current);

      // 只有当触发元素滚出视口时才显示（取消触底消失限制）
      setIsVisible(triggerScrolledOut);
    }
  }, [currentTriggerRef, isClosed]);

  // 处理关闭
  const handleClose = useCallback(() => {
    setIsClosed(true);
    setIsVisible(false);
  }, []);

  // 监听滚动事件
  useEffect(() => {
    // 初始检查
    handleScroll();

    // 监听滚动事件
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [handleScroll]);

  // 处理加入购物车
  const handleAddToCart = useCallback(async () => {
    if (!selectedVariant?.id) {
      return;
    }

    setIsAdding(true);

    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity,
        countryCode,
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    } finally {
      setIsAdding(false);
    }
  }, [selectedVariant, quantity, countryCode]);

  // hydration 之前返回 null，避免 SSR 渲染两个组件
  if (!isHydrated) {
    return null;
  }

  return (
    <Transition
      show={isVisible}
      enter="ease-in-out duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="ease-in duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div
        className="fixed bottom-0 left-0 right-0 z-[9999]"
        style={{ zIndex: STICKY_ADD_TO_CART_CONFIG.zIndex }}
      >
        {isDesktop ? (
          <DesktopStickyAddToCart
            product={product}
            region={region}
            quantity={quantity}
            onQuantityChange={setQuantity}
            isVisible={isVisible}
            onAddToCart={handleAddToCart}
            isAdding={isAdding}
            onClose={handleClose}
            customer={customer}
            loyaltyAccount={loyaltyAccount}
            membershipProductIds={membershipProductIds}
          />
        ) : (
          <MobileStickyAddToCart
            product={product}
            region={region}
            quantity={quantity}
            isVisible={isVisible}
            onAddToCart={handleAddToCart}
            isAdding={isAdding}
            onClose={handleClose}
            customer={customer}
            loyaltyAccount={loyaltyAccount}
            membershipProductIds={membershipProductIds}
          />
        )}
      </div>
    </Transition>
  );
}

