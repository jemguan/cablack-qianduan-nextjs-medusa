"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button, Text } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import OptionTemplateSelect from "@modules/products/components/product-actions/option-template-select"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { isEqual } from "lodash"
import ProductPrice from "../product-price"
// import MobileActions from "./mobile-actions" // 已禁用，使用 StickyAddToCart 替代
import { useVariantSelection } from "@modules/products/contexts/variant-selection-context"
import { useOptionTemplateSelection } from "@modules/products/contexts/option-template-selection-context"
import { ProductQuantitySelector } from "../quantity-selector"
import WishlistButton from "@modules/wishlist/components/wishlist-button"
import NotifyMeButton from "@modules/products/components/notify-me-button"
import ProductPointsInfo from "../product-points-info"
import ProductPointsLoginPrompt from "../product-points-login-prompt"
import { LoyaltyAccount, LoyaltyConfig } from "@/types/loyalty"
import type { OptionTemplate } from "@lib/data/option-templates"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
  /** 移动端布局模式：隐藏价格，只显示变体选择、数量选择和按钮 */
  mobileLayout?: boolean
  /** 当前登录的客户 */
  customer?: HttpTypes.StoreCustomer | null
  /** 积分账户信息 */
  loyaltyAccount?: LoyaltyAccount | null
  /** 积分系统配置 */
  loyaltyConfig?: LoyaltyConfig | null
  /** 会员产品 ID 列表 */
  membershipProductIds?: Record<string, boolean> | null
  /** 选项模板列表 */
  optionTemplates?: OptionTemplate[]
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
  mobileLayout = false,
  customer,
  loyaltyAccount,
  loyaltyConfig,
  membershipProductIds,
  optionTemplates = [],
}: ProductActionsProps) {
  const { options, selectedVariant, setOptionValue, setOptions } = useVariantSelection()
  const { selectedChoicesByTemplate, updateTemplateSelection } = useOptionTemplateSelection()
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const countryCode = useParams().countryCode as string
  const router = useRouter()

  // 检查当前产品是否是会员产品
  const isMembershipProduct = useMemo(() => {
    if (!membershipProductIds || !product.id) return false
    return membershipProductIds[product.id] === true
  }, [membershipProductIds, product.id])

  // 检查用户是否是 VIP
  const isVip = useMemo(() => {
    if (!loyaltyAccount) return false
    if (!loyaltyAccount.is_member) return false
    if (!loyaltyAccount.membership_expires_at) return false
    return new Date(loyaltyAccount.membership_expires_at) > new Date()
  }, [loyaltyAccount])

  // 检查用户是否已登录
  const isLoggedIn = !!customer

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // 不再更新 URL 中的 v_id 参数，保持 URL 简洁

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // 计算最大可选数量（基于库存）
  const maxQuantity = useMemo(() => {
    if (!selectedVariant) return 99
    if (!selectedVariant.manage_inventory) return 99
    if (selectedVariant.allow_backorder) return 99
    return Math.min(selectedVariant.inventory_quantity || 99, 99)
  }, [selectedVariant])

  // 当变体变化时，重置数量为1
  useEffect(() => {
    setQuantity(1)
  }, [selectedVariant?.id])

  // 初始化选项模板的默认选择
  useEffect(() => {
    if (!optionTemplates || optionTemplates.length === 0) return

    const defaultSelections: Record<string, string[]> = {}

    // 收集所有对比选项组（按模板分组）
    const comparisonGroupsByTemplate = new Map<string, Map<string, string[]>>() // templateId -> groupKey -> [optionId1, optionId2]

    optionTemplates.forEach((template) => {
      if (!template.is_active || !template.options) return

      const templateGroups = new Map<string, string[]>()

      template.options.forEach((option) => {
        if (option.is_comparison && option.comparison_option_id) {
          const groupKey = [option.id, option.comparison_option_id].sort().join("-")
          if (!templateGroups.has(groupKey)) {
            templateGroups.set(groupKey, [])
          }
          const group = templateGroups.get(groupKey)!
          if (!group.includes(option.id)) {
            group.push(option.id)
          }
          // 也添加被引用的选项
          if (!group.includes(option.comparison_option_id)) {
            group.push(option.comparison_option_id)
          }
        }
      })

      if (templateGroups.size > 0) {
        comparisonGroupsByTemplate.set(template.id, templateGroups)
      }
    })

    optionTemplates.forEach((template) => {
      if (!template.is_active || !template.options) return

      const templateChoices: string[] = []

      // 按 sort_order 排序选项
      const sortedOptions = [...template.options].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

      // 获取当前模板的对比选项组
      const templateGroups = comparisonGroupsByTemplate.get(template.id)
      const processedComparisonGroups = new Set<string>() // 已处理过的对比组

      sortedOptions.forEach((option) => {
        if (!option.choices || option.choices.length === 0) return

        // 检查该选项是否属于对比选项组
        let groupKeyForOption: string | null = null
        if (templateGroups) {
          for (const [key, group] of Array.from(templateGroups.entries())) {
            if (group.includes(option.id)) {
              groupKeyForOption = key
              break
            }
          }
        }

        const isInComparisonGroup = groupKeyForOption !== null

        // 如果是对比选项组中的选项，只选择组内第一个选项的默认值
        if (isInComparisonGroup) {
          // 如果这个组已经处理过，跳过
          if (processedComparisonGroups.has(groupKeyForOption!)) {
            return
          }
          processedComparisonGroups.add(groupKeyForOption!)

          // 找到组内第一个选项（按 sort_order）
          const group = templateGroups!.get(groupKeyForOption!)!
          const groupOptions = sortedOptions.filter(o => group.includes(o.id))
          const firstOptionInGroup = groupOptions[0]

          // 只为组内第一个选项设置默认值
          if (firstOptionInGroup && firstOptionInGroup.id === option.id) {
            const defaultChoice = firstOptionInGroup.choices?.find((c) => c.is_default)
            if (defaultChoice) {
              templateChoices.push(defaultChoice.id)
            }
          }
        } else {
          // 非对比选项，正常处理默认选择
          const defaultChoice = option.choices.find((choice) => choice.is_default)
          if (defaultChoice) {
            templateChoices.push(defaultChoice.id)
          }
        }
      })

      if (templateChoices.length > 0) {
        defaultSelections[template.id] = templateChoices
      }
    })

    // 只在有默认选择且当前没有选择时设置
    if (Object.keys(defaultSelections).length > 0) {
      // 检查是否已经有选择
      const hasExistingSelections = Object.values(selectedChoicesByTemplate).some(
        (choices) => choices.length > 0
      )
      if (!hasExistingSelections) {
        // 逐个设置默认选择
        Object.entries(defaultSelections).forEach(([templateId, choices]) => {
          updateTemplateSelection(templateId, choices)
        })
      }
    }
  }, [optionTemplates, selectedChoicesByTemplate, updateTemplateSelection])

  // 处理选项模板选择变化
  const handleTemplateSelectionChange = (templateId: string, choiceIds: string[]) => {
    updateTemplateSelection(templateId, choiceIds)
  }

  // 收集所有选中的选择信息（包含完整详情，用于添加到购物车）
  const getAllSelectedChoicesWithDetails = useMemo(() => {
    const allChoices: Array<{
      id: string
      title: string
      price_adjustment: number | string
      image_url?: string | null
      option_name: string
      template_title: string
    }> = []

    if (!optionTemplates || optionTemplates.length === 0) {
      return allChoices
    }

    optionTemplates.forEach((template) => {
      if (!template.is_active || !template.options) return

      const selectedChoiceIds = selectedChoicesByTemplate[template.id] || []

      template.options.forEach((option) => {
        if (!option.choices || option.choices.length === 0) return

        option.choices.forEach((choice) => {
          const isSelected = selectedChoiceIds.includes(choice.id)

          if (isSelected) {
            allChoices.push({
              id: choice.id,
              title: choice.title,
              price_adjustment: choice.price_adjustment,
              image_url: choice.image_url || undefined,
              option_name: option.name,
              template_title: template.title,
            })
          }
        })
      })
    })

    return allChoices
  }, [optionTemplates, selectedChoicesByTemplate])

  // 检查必选选项是否已选择
  const { isValidOptionSelections, missingRequiredOptions } = useMemo(() => {
    if (!optionTemplates || optionTemplates.length === 0) {
      return { isValidOptionSelections: true, missingRequiredOptions: [] }
    }

    const missing: string[] = []

    // 收集所有对比选项组（只处理一次）
    const comparisonGroups = new Map<string, {
      templateId: string
      templateName: string
      optionIds: string[]
      optionNames: string[]
    }>()

    optionTemplates.forEach((template) => {
      if (!template.is_active || !template.options) return

      template.options.forEach((option) => {
        // 处理对比选项组：收集所有相关的选项（包括 is_comparison: false 的选项）
        if (option.is_comparison && option.comparison_option_id) {
          const groupKey = [option.id, option.comparison_option_id].sort().join("-")
          if (!comparisonGroups.has(groupKey)) {
            comparisonGroups.set(groupKey, {
              templateId: template.id,
              templateName: template.title,
              optionIds: [],
              optionNames: [],
            })
          }
          const group = comparisonGroups.get(groupKey)!

          // 添加当前选项（is_comparison: true）
          if (!group.optionIds.includes(option.id)) {
            group.optionIds.push(option.id)
            group.optionNames.push(option.name)
          }

          // 查找并添加对比的选项（is_comparison 可能是 false）
          const comparedOption = template.options?.find((o) => o.id === option.comparison_option_id)
          if (comparedOption && !group.optionIds.includes(comparedOption.id)) {
            group.optionIds.push(comparedOption.id)
            group.optionNames.push(comparedOption.name)
          }
        }
      })
    })

    // 验证普通必选选项（排除对比选项组中的所有选项）
    optionTemplates.forEach((template) => {
      if (!template.is_active || !template.options) return

      const selectedChoices = selectedChoicesByTemplate[template.id] || []

      template.options.forEach((option) => {
        // 检查该选项是否属于对比选项组
        const isInComparisonGroup = Array.from(comparisonGroups.values()).some((group) =>
          group.optionIds.includes(option.id)
        )

        if (option.is_required && !isInComparisonGroup) {
          const hasSelection = (option.choices || []).some((choice) =>
            selectedChoices.includes(choice.id)
          )
          if (!hasSelection) {
            missing.push(option.name)
          }
        }
      })
    })

    // 验证对比选项组（组内任选一个即可）
    comparisonGroups.forEach((group) => {
      const selectedChoices = selectedChoicesByTemplate[group.templateId] || []

      // 检查组内是否有任何选项被选中
      const groupHasSelection = group.optionIds.some((optionId) => {
        const option = optionTemplates
          .find((t) => t.id === group.templateId)
          ?.options?.find((o) => o.id === optionId)
        return (option?.choices || []).some((choice) =>
          selectedChoices.includes(choice.id)
        )
      })

      if (!groupHasSelection) {
        const optionNames = group.optionNames.join(" / ")
        missing.push(`${optionNames} (Select one)`)
      }
    })

    return {
      isValidOptionSelections: missing.length === 0,
      missingRequiredOptions: missing,
    }
  }, [optionTemplates, selectedChoicesByTemplate])

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) {
      return null
    }

    setIsAdding(true)

    try {
      // 构建 metadata，包含选中的选择完整信息（用于正确计算价格）
      const metadata: Record<string, any> = {}
      if (getAllSelectedChoicesWithDetails.length > 0) {
        // 传递完整的选项信息，包括价格调整
        metadata.custom_options = getAllSelectedChoicesWithDetails.map((choice) => ({
          id: choice.id,
          title: choice.title,
          price_adjustment: choice.price_adjustment,
          image_url: choice.image_url || null,
          option_name: choice.option_name,
          template_title: choice.template_title,
        }))
      }

      await addToCart({
        variantId: selectedVariant.id,
        quantity,
        countryCode,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      })
    } catch (error) {
      console.error("Failed to add to cart:", error)
      throw error
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={mobileLayout ? undefined : actionsRef}>
        {/* 变体选择器 */}
        {(product.variants?.length ?? 0) > 1 && (
          <div className="flex flex-col gap-y-4">
            {(product.options || []).map((option) => {
              return (
                <div key={option.id}>
                  <OptionSelect
                    option={option}
                    current={options[option.id]}
                    updateOption={setOptionValue}
                    title={option.title ?? ""}
                    data-testid="product-options"
                    disabled={!!disabled || isAdding}
                    product={product}
                    options={options}
                  />
                </div>
              )
            })}
            {!mobileLayout && <Divider />}
          </div>
        )}

        {/* 选项模板选择器 - 只渲染有有效选项（带 choices）的模板 */}
        {optionTemplates.some((template) =>
          template.is_active &&
          template.options?.some((option) => option.choices && option.choices.length > 0)
        ) && (
          <div className="flex flex-col gap-y-6">
            {[...optionTemplates]
              .sort((a, b) => {
                // 按 sort_order 排序模板
                const orderA = typeof a.sort_order === 'number' ? a.sort_order : (a.sort_order ? Number(a.sort_order) : 0)
                const orderB = typeof b.sort_order === 'number' ? b.sort_order : (b.sort_order ? Number(b.sort_order) : 0)
                return orderA - orderB
              })
              .map((template) => (
                <OptionTemplateSelect
                  key={template.id}
                  template={template}
                  selectedChoiceIds={selectedChoicesByTemplate[template.id] || []}
                  onSelectionChange={handleTemplateSelectionChange}
                  disabled={!!disabled || isAdding}
                />
              ))}
            {!mobileLayout && <Divider />}
          </div>
        )}

        {/* 价格 - 移动端布局时隐藏 */}
        {!mobileLayout && (
          <>
            <ProductPrice product={product} variant={selectedVariant || undefined} />
            {/* 积分获取信息 - 根据登录状态显示不同组件 */}
            {selectedVariant?.calculated_price?.calculated_amount && (
              <>
                <ProductPointsInfo
                  price={selectedVariant.calculated_price.calculated_amount}
                  currencyCode={selectedVariant.calculated_price.currency_code || "cad"}
                  loyaltyAccount={loyaltyAccount}
                  loyaltyConfig={loyaltyConfig}
                  isLoggedIn={isLoggedIn}
                />
                <ProductPointsLoginPrompt
                  price={selectedVariant.calculated_price.calculated_amount}
                  currencyCode={selectedVariant.calculated_price.currency_code || "cad"}
                  loyaltyConfig={loyaltyConfig}
                  isLoggedIn={isLoggedIn}
                />
              </>
            )}
          </>
        )}

        {/* 数量选择器 */}
        <ProductQuantitySelector
          quantity={quantity}
          onQuantityChange={setQuantity}
          minQuantity={1}
          maxQuantity={maxQuantity}
          showLabel={true}
          size="md"
          disabled={!!disabled || isAdding || !selectedVariant || !isValidVariant}
        />

        {/* 必选选项错误提示 */}
        {!isValidOptionSelections && missingRequiredOptions.length > 0 && (
          <div className="p-3 rounded-lg bg-ui-bg-subtle border border-ui-border-base">
            <Text className="text-ui-fg-error text-sm font-medium">Please select the following options:</Text>
            <ul className="mt-1 text-sm text-ui-fg-subtle list-disc list-inside">
              {missingRequiredOptions.map((option, index) => (
                <li key={index}>{option}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 加入购物车和心愿单按钮 */}
        <div className="flex gap-2">
          {/* 会员产品特殊按钮处理 */}
          {isMembershipProduct ? (
            // 会员产品
            !isLoggedIn ? (
              // 未登录：显示绿色 "Need login to buy" 按钮
              <Button
                onClick={() => router.push("/account")}
                variant="primary"
                className="flex-1 h-10 text-white border-none !border-2 !shadow-none bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 !border-green-600 hover:!border-green-700 dark:!border-green-600 dark:hover:!border-green-700"
                style={{ borderColor: 'rgb(22 163 74)', borderWidth: '2px', borderStyle: 'solid' }}
                data-testid="membership-login-button"
              >
                Need login to buy
              </Button>
            ) : isVip ? (
              // VIP 用户：显示禁用按钮
              <Button
                disabled
                variant="primary"
                className="flex-1 h-10 text-white border-none !border-2 !shadow-none bg-ui-bg-disabled hover:bg-ui-bg-disabled dark:bg-ui-bg-disabled dark:hover:bg-ui-bg-disabled !border-ui-border-base cursor-not-allowed"
                style={{ borderColor: 'rgb(229 231 235)', borderWidth: '2px', borderStyle: 'solid' }}
                data-testid="membership-vip-button"
              >
                You are already a VIP
              </Button>
            ) : (
              // 普通用户（已登录非VIP）：正常添加到购物车
              <Button
                onClick={handleAddToCart}
                disabled={
                  !inStock ||
                  !selectedVariant ||
                  !!disabled ||
                  isAdding ||
                  !isValidVariant ||
                  !isValidOptionSelections
                }
                variant="primary"
                className={`flex-1 h-10 text-white border-none !border-2 !shadow-none ${
                  !inStock || !isValidVariant || !selectedVariant || !isValidOptionSelections
                    ? "bg-ui-bg-disabled hover:bg-ui-bg-disabled dark:bg-ui-bg-disabled dark:hover:bg-ui-bg-disabled !border-ui-border-base cursor-not-allowed"
                    : "bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 !border-orange-600 hover:!border-orange-700 dark:!border-orange-600 dark:hover:!border-orange-700"
                }`}
                style={
                  !inStock || !isValidVariant || !selectedVariant || !isValidOptionSelections
                    ? { borderColor: 'rgb(229 231 235)', borderWidth: '2px', borderStyle: 'solid' }
                    : { borderColor: 'rgb(234 88 12)', borderWidth: '2px', borderStyle: 'solid' }
                }
                isLoading={isAdding}
                data-testid="add-product-button"
              >
                {!selectedVariant && !options
                  ? "Select variant"
                  : !inStock || !isValidVariant
                  ? "Out of Stock"
                  : !isValidOptionSelections
                  ? "Select Options"
                  : "Add to Cart"}
              </Button>
            )
          ) : (
            // 非会员产品：正常添加到购物车按钮
            <Button
              onClick={handleAddToCart}
              disabled={
                !inStock ||
                !selectedVariant ||
                !!disabled ||
                isAdding ||
                !isValidVariant ||
                !isValidOptionSelections
              }
              variant="primary"
              className={`flex-1 h-10 text-white border-none !border-2 !shadow-none ${
                !inStock || !isValidVariant || !selectedVariant || !isValidOptionSelections
                  ? "bg-ui-bg-disabled hover:bg-ui-bg-disabled dark:bg-ui-bg-disabled dark:hover:bg-ui-bg-disabled !border-ui-border-base cursor-not-allowed"
                  : "bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 !border-orange-600 hover:!border-orange-700 dark:!border-orange-600 dark:hover:!border-orange-700"
              }`}
              style={
                !inStock || !isValidVariant || !selectedVariant || !isValidOptionSelections
                  ? { borderColor: 'rgb(229 231 235)', borderWidth: '2px', borderStyle: 'solid' }
                  : { borderColor: 'rgb(234 88 12)', borderWidth: '2px', borderStyle: 'solid' }
              }
              isLoading={isAdding}
              data-testid="add-product-button"
            >
              {!selectedVariant && !options
                ? "Select variant"
                : !inStock || !isValidVariant
                ? "Out of Stock"
                : !isValidOptionSelections
                ? "Select Options"
                : "Add to Cart"}
            </Button>
          )}
          <WishlistButton product={product} size="md" iconOnly />
        </div>

        {/* 缺货时显示 Notify Me 按钮 */}
        {!inStock && selectedVariant && (
          <div className="flex gap-2">
            <NotifyMeButton
              product={product}
              variant={selectedVariant}
              customer={customer}
              size="md"
              showLabel={true}
              className="flex-1"
            />
          </div>
        )}
        {/* MobileActions 已禁用，因为 StickyAddToCart 提供了更好的移动端体验 */}
        {/* <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        /> */}
      </div>
    </>
  )
}
