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

type QuantitySelectorProps = {
  /** 当前数量 */
  quantity: number;
  /** 数量变化回调函数 */
  onQuantityChange: (quantity: number) => void;
  /** 最小数量 */
  minQuantity?: number;
  /** 最大数量 */
  maxQuantity?: number;
  /** 是否显示标签 */
  showLabel?: boolean;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 自定义类名 */
  className?: string;
};

/**
 * 数量选择器组件
 * 用于粘性购物栏中选择商品数量
 */
export function QuantitySelector({
  quantity,
  onQuantityChange,
  minQuantity = 1,
  maxQuantity = 99,
  showLabel = false,
  size = 'sm',
  className,
}: QuantitySelectorProps) {
  // 生成数量选项数组
  const quantities = Array.from(
    { length: maxQuantity - minQuantity + 1 },
    (_, i) => minQuantity + i,
  );

  const sizeClasses = {
    sm: 'h-8 text-xs',
    md: 'h-9 text-sm',
    lg: 'h-10 text-base',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showLabel && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Qty:
        </span>
      )}
      <Select
        value={String(quantity)}
        onValueChange={(value) => onQuantityChange(parseInt(value, 10))}
      >
        <SelectTrigger className={cn('w-20', sizeClasses[size])}>
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

