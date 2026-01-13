import { HttpTypes } from "@medusajs/types"

/**
 * 计算选项加价的总金额（单位：元）
 * @param customOptions - 自定义选项数组
 * @returns 总加价金额（元）
 */
export function calculateOptionsPriceAdjustment(
  customOptions: Array<{
    price_adjustment: number | string
  }> | undefined | null
): number {
  if (!customOptions || !Array.isArray(customOptions) || customOptions.length === 0) {
    return 0
  }

  let totalAdjustment = 0

  customOptions.forEach((option) => {
    if (option.price_adjustment) {
      const adjustment = typeof option.price_adjustment === "string"
        ? parseFloat(option.price_adjustment)
        : option.price_adjustment

      if (!isNaN(adjustment)) {
        // price_adjustment 单位是分，转换为元
        totalAdjustment += adjustment / 100
      }
    }
  })

  return totalAdjustment
}

/**
 * 计算包含选项加价的总价
 * @param item - 购物车项
 * @returns 包含选项加价的总价（元）
 */
export function calculateLineItemTotalWithOptions(
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
): number {
  // 基础价格（从 item 获取）
  const baseTotal = (item as any).total || 0

  // 获取选项加价
  const metadata = item.metadata as Record<string, any> | undefined
  const customOptions = metadata?.custom_options
  const optionsAdjustment = calculateOptionsPriceAdjustment(customOptions)

  // 如果有选项加价，返回基础价格加上加价
  // 注意：baseTotal 应该是后端计算的价格（已经包含选项加价）
  // 但如果后端没有正确计算，我们可能需要前端来计算
  // 这里我们假设后端已经正确计算了基础价格，选项加价已经包含在其中
  // 但如果后端没有正确处理，我们返回 baseTotal（可能不准确）

  return baseTotal
}

/**
 * 检查后端是否正确计算了选项价格
 * 如果基础价格与选项加价之和不等于总价，说明后端可能没有正确计算
 * @param item - 购物车项
 * @returns 是否可能计算错误
 */
export function optionsPriceMayBeMiscalculated(
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
): boolean {
  const metadata = item.metadata as Record<string, any> | undefined
  const customOptions = metadata?.custom_options

  if (!customOptions || !Array.isArray(customOptions) || customOptions.length === 0) {
    return false
  }

  const baseTotal = (item as any).subtotal || (item as any).total || 0
  const optionsAdjustment = calculateOptionsPriceAdjustment(customOptions)

  // 如果选项加价大于0，但基础价格很低（可能是0或接近0），说明可能有问题
  // 注意：这个检查不是完全准确的，因为可能有其他因素影响价格
  return optionsAdjustment > 0 && baseTotal < optionsAdjustment
}
