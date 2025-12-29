/**
 * 计算捆绑包折扣后的价格
 * @param originalTotal 原始总价
 * @param discountType 折扣类型
 * @param discountValue 折扣值
 * @returns 折扣后的价格信息
 */
export function calculateBundlePrice(
  originalTotal: number,
  discountType: "percentage" | "fixed_amount" | "fixed_price",
  discountValue: number
): {
  originalPrice: number
  finalPrice: number
  savedAmount: number
  discountPercentage: number
} {
  let finalPrice: number

  switch (discountType) {
    case "percentage":
      finalPrice = originalTotal * (1 - discountValue / 100)
      break
    case "fixed_amount":
      finalPrice = Math.max(0, originalTotal - discountValue)
      break
    case "fixed_price":
      finalPrice = discountValue
      break
    default:
      finalPrice = originalTotal
  }

  const savedAmount = originalTotal - finalPrice
  const discountPercentage =
    originalTotal > 0 ? (savedAmount / originalTotal) * 100 : 0

  return {
    originalPrice: originalTotal,
    finalPrice,
    savedAmount,
    discountPercentage,
  }
}

