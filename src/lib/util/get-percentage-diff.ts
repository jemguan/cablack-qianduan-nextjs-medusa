export const getPercentageDiff = (original: number, calculated: number) => {
  // 折扣计算：（卖价-对比价格）/对比价格 * 100
  // original 是对比价格（元），calculated 是卖价（元）
  // 注意：这里传入的 original 和 calculated 应该已经是相同的单位（都是元或都是分）
  const diff = calculated - original
  const discount = (diff / original) * 100

  // 返回绝对值并四舍五入，因为折扣百分比应该是正数
  return Math.abs(Math.round(discount)).toFixed()
}
