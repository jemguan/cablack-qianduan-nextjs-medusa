/**
 * 检查 line item 是否有额外选项的价格增加
 */
export function hasCustomOptionsPrice(
  item: {
    metadata?: Record<string, any>
  }
): boolean {
  const metadata = item.metadata as Record<string, any> | undefined
  const customOptions = metadata?.custom_options

  if (!customOptions || !Array.isArray(customOptions)) {
    return false
  }

  // 如果有选项，就认为可能有价格增加
  // 实际价格计算在后端完成，这里只是检查是否有选项
  return customOptions.length > 0
}
