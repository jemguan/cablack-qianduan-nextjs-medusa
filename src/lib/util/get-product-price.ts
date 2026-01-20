import { HttpTypes } from "@medusajs/types"
import { getPercentageDiff } from "./get-percentage-diff"
import { convertToLocale } from "./money"

/**
 * 变体的计算价格类型
 */
type CalculatedPrice = {
  calculated_amount: number
  original_amount: number
  currency_code: string
  calculated_price: {
    price_list_type?: string | null
  }
}

/**
 * 带有计算价格的变体类型
 */
type VariantWithCalculatedPrice = HttpTypes.StoreProductVariant & {
  calculated_price?: CalculatedPrice
  metadata?: {
    compare_at_price?: string | number
    [key: string]: unknown
  }
}

export const getPricesForVariant = (variant: VariantWithCalculatedPrice | null | undefined) => {
  if (!variant?.calculated_price?.calculated_amount) {
    return null
  }

  const calculatedAmount = variant.calculated_price.calculated_amount
  const currencyCode = variant.calculated_price.currency_code
  
  // 获取对比价格（从 metadata 中）
  let compareAtPriceAmount: number | null = null
  if (variant.metadata?.compare_at_price) {
    // compare_at_price 存储的是分，需要转换为数字
    const comparePrice = variant.metadata.compare_at_price
    compareAtPriceAmount = typeof comparePrice === 'number' 
      ? comparePrice 
      : parseInt(comparePrice, 10)
    
    // 如果转换失败，设为 null
    if (isNaN(compareAtPriceAmount)) {
      compareAtPriceAmount = null
    }
  }

  // 确定原价：优先使用 Price List 的原价，如果没有则使用对比价格
  let originalAmount = variant.calculated_price.original_amount
  let shouldShowComparePrice = false

  // 如果 Price List 有原价（促销价格），使用 Price List 的原价
  if (variant.calculated_price.calculated_price.price_list_type === "sale" && 
      variant.calculated_price.original_amount > calculatedAmount) {
    originalAmount = variant.calculated_price.original_amount
    shouldShowComparePrice = true
  } 
  // 如果没有 Price List 原价，但有对比价格，且现价低于对比价格，使用对比价格
  else if (compareAtPriceAmount !== null && compareAtPriceAmount > calculatedAmount) {
    originalAmount = compareAtPriceAmount
    shouldShowComparePrice = true
  }

  // 对比价格在 metadata 中存储为分（cents），但需要转换为与 calculated_amount 相同的单位
  // 根据用户反馈（50变成5000），说明 calculated_amount 是元，对比价格需要除以100
  let displayOriginalAmount = originalAmount
  if (shouldShowComparePrice && compareAtPriceAmount !== null && compareAtPriceAmount === originalAmount) {
    // 对比价格存储为分，但 calculated_amount 是元，所以需要除以100
    displayOriginalAmount = originalAmount / 100
  }

  // 最终检查：如果显示价格和原价相等，则不显示对比价格
  // 使用 displayOriginalAmount 进行比较，因为这是实际显示的价格
  if (shouldShowComparePrice && displayOriginalAmount <= calculatedAmount) {
    shouldShowComparePrice = false
    // 如果价格相等，重置 originalAmount 为 calculatedAmount
    originalAmount = calculatedAmount
    displayOriginalAmount = calculatedAmount
  }

  return {
    calculated_price_number: calculatedAmount,
    calculated_price: convertToLocale({
      amount: calculatedAmount,
      currency_code: currencyCode,
    }),
    original_price_number: originalAmount,
    original_price: convertToLocale({
      amount: displayOriginalAmount,
      currency_code: currencyCode,
    }),
    currency_code: currencyCode,
    price_type: shouldShowComparePrice ? "sale" : variant.calculated_price.calculated_price.price_list_type || "default",
    percentage_diff: shouldShowComparePrice 
      ? getPercentageDiff(displayOriginalAmount, calculatedAmount)
      : (variant.calculated_price.calculated_price.price_list_type === "sale"
          ? getPercentageDiff(
      variant.calculated_price.original_amount,
      variant.calculated_price.calculated_amount
            )
          : "0"),
  }
}

export function getProductPrice({
  product,
  variantId,
}: {
  product: HttpTypes.StoreProduct
  variantId?: string
}) {
  if (!product || !product.id) {
    throw new Error("No product provided")
  }

  const cheapestPrice = () => {
    if (!product || !product.variants?.length) {
      return null
    }

    const variantsWithPrice = product.variants as VariantWithCalculatedPrice[]
    const cheapestVariant = variantsWithPrice
      .filter((v) => !!v.calculated_price)
      .sort((a, b) => {
        return (
          (a.calculated_price?.calculated_amount || 0) -
          (b.calculated_price?.calculated_amount || 0)
        )
      })[0]

    return getPricesForVariant(cheapestVariant)
  }

  const variantPrice = () => {
    if (!product || !variantId) {
      return null
    }

    const variant = product.variants?.find(
      (v) => v.id === variantId || v.sku === variantId
    ) as VariantWithCalculatedPrice | undefined

    if (!variant) {
      return null
    }

    return getPricesForVariant(variant)
  }

  return {
    product,
    cheapestPrice: cheapestPrice(),
    variantPrice: variantPrice(),
  }
}
