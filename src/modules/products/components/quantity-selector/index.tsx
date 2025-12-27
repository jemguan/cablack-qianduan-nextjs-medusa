"use client";

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type ProductQuantitySelectorProps = {
  /** 当前数量 */
  quantity: number;
  /** 数量变化回调函数 */
  onQuantityChange: (quantity: number) => void;
  /** 最小数量 */
  minQuantity?: number;
  /** 最大数量（根据库存自动计算） */
  maxQuantity?: number;
  /** 是否显示标签 */
  showLabel?: boolean;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 自定义类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
};

/**
 * 产品数量选择器组件
 * 用于产品页面和快速查看中选择商品数量
 */
export function ProductQuantitySelector({
  quantity,
  onQuantityChange,
  minQuantity = 1,
  maxQuantity = 99,
  showLabel = true,
  size = 'md',
  className,
  disabled = false,
}: ProductQuantitySelectorProps) {
  // 生成数量选项数组
  const quantities = Array.from(
    { length: Math.min(maxQuantity - minQuantity + 1, 99) },
    (_, i) => minQuantity + i,
  );

  const sizeClasses = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base',
  };

  return (
    <div className={cn('flex flex-col gap-y-2', className)}>
      {showLabel && (
        <span className="text-sm text-ui-fg-subtle">Quantity</span>
      )}
      <Select
        value={String(quantity)}
        onValueChange={(value) => onQuantityChange(parseInt(value, 10))}
        disabled={disabled}
      >
        <SelectTrigger className={cn('w-full', sizeClasses[size])}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {quantities.map((qty) => (
            <SelectItem key={qty} value={String(qty)}>
              {qty}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

