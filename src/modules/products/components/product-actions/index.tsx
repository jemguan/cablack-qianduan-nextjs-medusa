"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import OptionTemplateSelect from "@modules/products/components/product-actions/option-template-select"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { isEqual } from "lodash"
import ProductPrice from "../product-price"
// import MobileActions from "./mobile-actions" // 已禁用，使用 StickyAddToCart 替代
import { useVariantSelection } from "@modules/products/contexts/variant-selection-context"
import { ProductQuantitySelector } from "../quantity-selector"
import WishlistButton from "@modules/wishlist/components/wishlist-button"
import ProductPointsInfo from "../product-points-info"
import ProductPointsLoginPrompt from "../product-points-login-prompt"
import { LoyaltyAccount } from "@/types/loyalty"

// 选择（Choice）- 最底层，用户实际选择的项目
type Choice = {
  id: string
  title: string
  subtitle?: string | null
  hint_text?: string | null
  price_adjustment: number | string
  image_url?: string | null
  sort_order: number
}

// 选项（Option）- 中间层，包含多个选择
type Option = {
  id: string
  name: string
  hint_text?: string | null
  selection_type: "single" | "multiple"
  is_required: boolean
  is_comparison: boolean
  comparison_option_id?: string | null
  sort_order: number
  choices?: Choice[]
}

// 模板（Template）- 顶层，包含多个选项
type OptionTemplate = {
  id: string
  title: string
  description?: string | null
  is_active: boolean
  options?: Option[]
}

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
  membershipProductIds,
  optionTemplates = [],
}: ProductActionsProps) {
  const { options, selectedVariant, setOptionValue, setOptions } = useVariantSelection()
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  // 选项模板选择状态：{ templateId: choiceId[] }
  const [selectedChoicesByTemplate, setSelectedChoicesByTemplate] = useState<
    Record<string, string[]>
  >({})
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

  // 处理选项模板选择变化
  const handleTemplateSelectionChange = (templateId: string, choiceIds: string[]) => {
    setSelectedChoicesByTemplate((prev) => ({
      ...prev,
      [templateId]: choiceIds,
    }))
  }

  // 收集所有选中的选择 ID（扁平化）
  const getAllSelectedChoiceIds = useMemo(() => {
    return Object.values(selectedChoicesByTemplate).flat()
  }, [selectedChoicesByTemplate])

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) {
      return null
    }

    setIsAdding(true)

    try {
      // 构建 metadata，包含选中的选择 ID
      const metadata: Record<string, any> = {}
      if (getAllSelectedChoiceIds.length > 0) {
        metadata.custom_options = getAllSelectedChoiceIds
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

        {/* 选项模板选择器 */}
        {optionTemplates.length > 0 && (
          <div className="flex flex-col gap-y-6">
            {optionTemplates.map((template) => (
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
                />
                <ProductPointsLoginPrompt
                  price={selectedVariant.calculated_price.calculated_amount}
                  currencyCode={selectedVariant.calculated_price.currency_code || "cad"}
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
                  !isValidVariant
                }
                variant="primary"
                className={`flex-1 h-10 text-white border-none !border-2 !shadow-none ${
                  !inStock || !isValidVariant || !selectedVariant
                    ? "bg-ui-bg-disabled hover:bg-ui-bg-disabled dark:bg-ui-bg-disabled dark:hover:bg-ui-bg-disabled !border-ui-border-base cursor-not-allowed"
                    : "bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 !border-orange-600 hover:!border-orange-700 dark:!border-orange-600 dark:hover:!border-orange-700"
                }`}
                style={
                  !inStock || !isValidVariant || !selectedVariant
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
                !isValidVariant
              }
              variant="primary"
              className={`flex-1 h-10 text-white border-none !border-2 !shadow-none ${
                !inStock || !isValidVariant || !selectedVariant
                  ? "bg-ui-bg-disabled hover:bg-ui-bg-disabled dark:bg-ui-bg-disabled dark:hover:bg-ui-bg-disabled !border-ui-border-base cursor-not-allowed"
                  : "bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 !border-orange-600 hover:!border-orange-700 dark:!border-orange-600 dark:hover:!border-orange-700"
              }`}
              style={
                !inStock || !isValidVariant || !selectedVariant
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
                : "Add to Cart"}
            </Button>
          )}
          <WishlistButton product={product} size="md" iconOnly />
        </div>
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
