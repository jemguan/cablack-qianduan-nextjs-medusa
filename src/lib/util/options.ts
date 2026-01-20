import { HttpTypes } from "@medusajs/types"

/**
 * 产品变体选项的类型定义
 */
export type ProductVariantOption = {
  option_id: string
  value: string
}

/**
 * 将变体选项数组转换为 optionId -> value 的映射对象
 * @param variantOptions - 变体选项数组
 * @returns 选项映射对象，key 为 option_id，value 为选项值
 */
export const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
): Record<string, string> | undefined => {
  return variantOptions?.reduce(
    (acc: Record<string, string>, varopt: ProductVariantOption) => {
      acc[varopt.option_id] = varopt.value
      return acc
    },
    {}
  )
}

/**
 * 检查两个选项映射是否相等
 * @param options1 - 第一个选项映射
 * @param options2 - 第二个选项映射
 * @returns 是否相等
 */
export const areOptionsEqual = (
  options1: Record<string, string | undefined> | undefined,
  options2: Record<string, string> | undefined
): boolean => {
  if (!options1 || !options2) return false

  const keys1 = Object.keys(options1)
  const keys2 = Object.keys(options2)

  if (keys1.length !== keys2.length) return false

  return keys1.every((key) => options1[key] === options2[key])
}

/**
 * 根据选项查找匹配的变体
 * @param variants - 变体数组
 * @param options - 当前选中的选项
 * @returns 匹配的变体或 null
 */
export const findVariantByOptions = (
  variants: HttpTypes.StoreProductVariant[] | undefined | null,
  options: Record<string, string | undefined>
): HttpTypes.StoreProductVariant | null => {
  if (!variants || variants.length === 0) {
    return null
  }

  return (
    variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return areOptionsEqual(options, variantOptions)
    }) || null
  )
}
