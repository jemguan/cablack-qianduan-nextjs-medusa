"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import OptionTemplateSelect from "@modules/products/components/option-template-select"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { isEqual } from "lodash"
import ProductPrice from "../product-price"
import { useVariantSelection } from "@modules/products/contexts/variant-selection-context"
import { useOptionTemplateSelection } from "@modules/products/contexts/option-template-selection-context"
import { ProductQuantitySelector } from "../quantity-selector"
import WishlistButton from "@modules/wishlist/components/wishlist-button"
import { useRestockNotify } from "@lib/context/restock-notify-context"
import ProductPointsInfo from "../product-points-info"
import ProductPointsLoginPrompt from "../product-points-login-prompt"
import { LoyaltyAccount, LoyaltyConfig } from "@/types/loyalty"
import type { OptionTemplate } from "@lib/data/option-templates"

// 导入拆分的 hooks
import {
  useOptionTemplateDefaults,
  useSelectedChoices,
  useOptionValidation,
} from "./hooks"

// 导入拆分的组件
import {
  AddToCartButton,
  NotifyMeButton,
  MembershipLoginButton,
  MembershipVipButton,
  MissingOptionsAlert,
} from "./components"

// 导入工具函数
import {
  optionsAsKeymap,
  checkInStock,
  calculateMaxQuantity,
  checkIsVip,
} from "./utils"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
  mobileLayout?: boolean
  customer?: HttpTypes.StoreCustomer | null
  loyaltyAccount?: LoyaltyAccount | null
  loyaltyConfig?: LoyaltyConfig | null
  membershipProductIds?: Record<string, boolean> | null
  optionTemplates?: OptionTemplate[]
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
  const { options, selectedVariant, setOptionValue } = useVariantSelection()
  const { selectedChoicesByTemplate, updateTemplateSelection } = useOptionTemplateSelection()
  const { isSubscribedToVariant, toggleRestockSubscription, isLoading: isNotifyLoading } = useRestockNotify()
  const [isAdding, setIsAdding] = useState(false)
  const [isTogglingNotify, setIsTogglingNotify] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const countryCode = useParams().countryCode as string
  const router = useRouter()
  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")

  // 使用拆分的 hooks
  useOptionTemplateDefaults({
    optionTemplates,
    selectedChoicesByTemplate,
    updateTemplateSelection,
  })

  const selectedChoicesWithDetails = useSelectedChoices({
    optionTemplates,
    selectedChoicesByTemplate,
  })

  const { isValid: isValidOptionSelections, missingOptions: missingRequiredOptions } = useOptionValidation({
    optionTemplates,
    selectedChoicesByTemplate,
  })

  // 计算派生状态
  const isMembershipProduct = useMemo(() => {
    if (!membershipProductIds || !product.id) return false
    return membershipProductIds[product.id] === true
  }, [membershipProductIds, product.id])

  const isVip = useMemo(() => checkIsVip(loyaltyAccount), [loyaltyAccount])
  const isLoggedIn = !!customer
  const inStock = useMemo(() => checkInStock(selectedVariant ?? undefined), [selectedVariant])
  const maxQuantity = useMemo(() => calculateMaxQuantity(selectedVariant ?? undefined), [selectedVariant])

  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  const isSubscribed = useMemo(() => {
    if (!selectedVariant) return false
    return isSubscribedToVariant(selectedVariant.id)
  }, [selectedVariant, isSubscribedToVariant])

  // 当变体变化时，重置数量为1
  useEffect(() => {
    setQuantity(1)
  }, [selectedVariant?.id])

  // 处理补货通知
  const handleNotifyMe = async () => {
    if (!selectedVariant) return
    if (!customer) {
      router.push("/account")
      return
    }
    setIsTogglingNotify(true)
    try {
      await toggleRestockSubscription(product, selectedVariant, customer.email || "")
    } catch (error) {
      console.error("Failed to toggle notification:", error)
    } finally {
      setIsTogglingNotify(false)
    }
  }

  // 处理添加购物车
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null
    setIsAdding(true)
    try {
      const metadata: Record<string, any> = {}
      if (selectedChoicesWithDetails.length > 0) {
        metadata.custom_options = selectedChoicesWithDetails.map((choice) => ({
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

  // 渲染操作按钮
  const renderActionButton = () => {
    const showNotifyMe = !inStock && selectedVariant && isValidVariant

    if (isMembershipProduct) {
      if (!isLoggedIn) {
        return <MembershipLoginButton onClick={() => router.push("/account")} />
      }
      if (isVip) {
        return <MembershipVipButton />
      }
    }

    if (showNotifyMe) {
      return (
        <NotifyMeButton
          onClick={handleNotifyMe}
          isLoading={isTogglingNotify || isNotifyLoading}
          isSubscribed={isSubscribed}
        />
      )
    }

    return (
      <AddToCartButton
        onClick={handleAddToCart}
        isLoading={isAdding}
        disabled={!inStock || !!disabled || isAdding}
        isValidVariant={!!isValidVariant}
        hasSelectedVariant={!!selectedVariant}
        isValidOptionSelections={isValidOptionSelections}
        hasOptions={!!options}
      />
    )
  }

  // 检查是否有有效的选项模板
  const hasValidOptionTemplates = optionTemplates.some((template) =>
    template.is_active &&
    template.options?.some((option) => option.choices && option.choices.length > 0)
  )

  return (
    <div className="flex flex-col gap-y-2" ref={mobileLayout ? undefined : actionsRef}>
      {/* 变体选择器 */}
      {(product.variants?.length ?? 0) > 1 && (
        <div className="flex flex-col gap-y-4">
          {(product.options || []).map((option) => (
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
          ))}
          {!mobileLayout && <Divider />}
        </div>
      )}

      {/* 选项模板选择器 */}
      {hasValidOptionTemplates && (
        <div className="flex flex-col gap-y-6">
          {[...optionTemplates]
            .sort((a, b) => {
              const orderA = typeof a.sort_order === 'number' ? a.sort_order : (a.sort_order ? Number(a.sort_order) : 0)
              const orderB = typeof b.sort_order === 'number' ? b.sort_order : (b.sort_order ? Number(b.sort_order) : 0)
              return orderA - orderB
            })
            .map((template) => (
              <OptionTemplateSelect
                key={template.id}
                template={template}
                selectedChoiceIds={selectedChoicesByTemplate[template.id] || []}
                onSelectionChange={(templateId, choiceIds) => updateTemplateSelection(templateId, choiceIds)}
                disabled={!!disabled || isAdding}
              />
            ))}
          {!mobileLayout && <Divider />}
        </div>
      )}

      {/* 价格和积分信息 - 移动端布局时隐藏 */}
      {!mobileLayout && (
        <>
          <ProductPrice product={product} variant={selectedVariant || undefined} />
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
      {!isValidOptionSelections && (
        <MissingOptionsAlert missingOptions={missingRequiredOptions} />
      )}

      {/* 加入购物车和心愿单按钮 */}
      <div className="flex gap-2">
        {renderActionButton()}
        <WishlistButton product={product} size="md" iconOnly />
      </div>
    </div>
  )
}
