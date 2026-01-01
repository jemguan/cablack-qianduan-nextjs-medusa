"use client"

import { useState, useMemo } from "react"
import type { BundleSaleData } from "./types"
import type { BundleWithProducts } from "./hooks"
import { DEFAULT_BUNDLE_SALE_CONFIG } from "./config"
import { convertToLocale } from "@lib/util/money"
import { getProductPrice } from "@lib/util/get-product-price"
import { addToCart, createBundlePromotion } from "@lib/data/cart"
import { useParams } from "next/navigation"
import { calculateBundlePrice } from "@lib/util/bundle-price"
import BundleProductCard from "./BundleProductCard"
import { EmblaCarousel } from "@lib/ui/embla-carousel"
import type { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import { ChevronDownMini, ChevronUpMini } from "@medusajs/icons"

interface DesktopBundleSaleProps {
  currentProduct: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  bundlesWithProducts: BundleWithProducts[]
  config: BundleSaleData
}

/**
 * Bundle Sale 桌面端组件
 * 根据配置选择显示模式：
 * - 如果启用轮播且捆绑包数量 > desktopMaxCount: 使用轮播布局
 * - 否则: 使用网格布局
 */
export function DesktopBundleSale({
  currentProduct,
  region,
  bundlesWithProducts,
  config,
}: DesktopBundleSaleProps) {
  const {
    maxItems = DEFAULT_BUNDLE_SALE_CONFIG.maxItems,
    desktopBundleCols = DEFAULT_BUNDLE_SALE_CONFIG.desktopBundleCols,
    desktopMaxCount = DEFAULT_BUNDLE_SALE_CONFIG.desktopMaxCount,
    desktopEnableCarousel = DEFAULT_BUNDLE_SALE_CONFIG.desktopEnableCarousel,
  } = config

  // 过滤和限制 bundles
  const displayBundles = useMemo(() => {
    if (!bundlesWithProducts || bundlesWithProducts.length === 0) return []
    return bundlesWithProducts.slice(0, maxItems)
  }, [bundlesWithProducts, maxItems])

  if (displayBundles.length === 0) {
    return null
  }

  // 判断是否使用轮播：启用轮播且捆绑包数量超过阈值
  const shouldUseCarousel =
    desktopEnableCarousel &&
    displayBundles.length > desktopMaxCount

  // Bundle 卡片网格列数配置
  const bundleGridColsMap: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }

  return (
    <div className="w-full">
      {shouldUseCarousel ? (
        // 轮播布局模式 - 使用 EmblaCarousel
        <EmblaCarousel
          desktopSlidesPerView={desktopBundleCols}
          mobileSlidesPerView={1}
          spacing={config.desktopCarouselSpacing || 24}
          showPagination={config.desktopCarouselShowPagination ?? true}
          showNavigation={config.desktopCarouselShowNavigation ?? true}
          loop={
            config.desktopCarouselLoop ??
            (displayBundles.length > desktopBundleCols ? true : false)
          }
          autoplay={config.desktopCarouselAutoplay ?? false}
          autoplayDelay={config.desktopCarouselAutoplayDelay || 3000}
          align={config.desktopCarouselAlign || 'start'}
          draggable={config.desktopCarouselDraggable ?? true}
        >
          {displayBundles.map((bundleData) => (
            <BundleCard
              key={bundleData.bundle.id}
              bundleData={bundleData}
              currentProduct={currentProduct}
              region={region}
              config={config}
            />
          ))}
        </EmblaCarousel>
      ) : (
        // 网格布局模式 - 显示所有捆绑包
        <div className={clx(
          "w-full grid gap-6",
          bundleGridColsMap[desktopBundleCols] || "grid-cols-1"
        )}>
          {displayBundles.map((bundleData) => (
            <BundleCard
              key={bundleData.bundle.id}
              bundleData={bundleData}
              currentProduct={currentProduct}
              region={region}
              config={config}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface BundleCardProps {
  bundleData: BundleWithProducts
  currentProduct: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  config: BundleSaleData
}

/** 每行固定显示的产品数量 */
const PRODUCTS_PER_ROW = 2

/**
 * Bundle 卡片组件
 * 产品内部布局：每行固定 2 个产品，超过 2 个可展开/折叠
 */
function BundleCard({
  bundleData,
  currentProduct,
  region,
  config,
}: BundleCardProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const params = useParams()
  const countryCode = params.countryCode as string

  const { bundle, addonProducts, quantityMap } = bundleData

  const {
    showProducts = DEFAULT_BUNDLE_SALE_CONFIG.showProducts,
    maxProducts = DEFAULT_BUNDLE_SALE_CONFIG.maxProducts,
    ctaText = DEFAULT_BUNDLE_SALE_CONFIG.ctaText,
    showDiscountBadge = DEFAULT_BUNDLE_SALE_CONFIG.showDiscountBadge,
  } = config

  // 限制显示的副产品数量
  const displayAddonProducts = addonProducts.slice(0, maxProducts)

  // 所有产品（主产品 + 副产品）
  const allProducts = [currentProduct, ...displayAddonProducts]
  const totalProductCount = allProducts.length

  // 是否需要折叠（超过每行显示数量）
  const needsCollapse = totalProductCount > PRODUCTS_PER_ROW

  // 可见的产品
  const visibleProducts = needsCollapse && !isExpanded
    ? allProducts.slice(0, PRODUCTS_PER_ROW)
    : allProducts

  // 隐藏的产品数量
  const hiddenCount = totalProductCount - PRODUCTS_PER_ROW

  // 计算价格 - 使用选中的变体价格，如果没有选中则使用最便宜的价格
  // 使用 useMemo 确保当 selectedVariants 变化时价格会重新计算
  const { mainPrice, addonPrice, totalPrice, priceInfo } = useMemo(() => {
    // 计算主产品价格
    const mainVariantId = selectedVariants[currentProduct.id] || currentProduct.variants?.[0]?.id
    const mainPriceInfo = getProductPrice({ 
      product: currentProduct, 
      variantId: mainVariantId 
    })
    const mainPrice = mainPriceInfo.variantPrice?.calculated_price_number || 
                      mainPriceInfo.cheapestPrice?.calculated_price_number || 0

    // 计算副产品总价
    const addonPrice = displayAddonProducts.reduce((sum, product) => {
      const variantId = selectedVariants[product.id] || product.variants?.[0]?.id
      const priceInfo = getProductPrice({ product, variantId })
      const price = priceInfo.variantPrice?.calculated_price_number || 
                    priceInfo.cheapestPrice?.calculated_price_number || 0
      const quantity = quantityMap[product.id] || 1
      return sum + price * quantity
    }, 0)

    const totalPrice = mainPrice + addonPrice

    // 计算折扣后价格
    const priceInfo = calculateBundlePrice(
      totalPrice,
      bundle.discount_type,
      bundle.discount_value
    )

    return { mainPrice, addonPrice, totalPrice, priceInfo }
  }, [selectedVariants, currentProduct, displayAddonProducts, quantityMap, bundle.discount_type, bundle.discount_value])

  // 生成折扣文本
  const getDiscountText = () => {
    if (bundle.discount_type === "percentage") {
      return `${bundle.discount_value}% OFF`
    }
    return (
      convertToLocale({
        amount: bundle.discount_value,
        currency_code: region.currency_code,
      }) + " OFF"
    )
  }

  // 处理添加到购物车
  const handleAddToCart = async () => {
    setIsAdding(true)
    setError(null)

    try {
      // 1. 获取主产品变体 ID
      const mainVariantId =
        selectedVariants[currentProduct.id] || currentProduct.variants?.[0]?.id

      if (!mainVariantId) {
        throw new Error("Please select a variant for the main product")
      }

      // 2. 先添加主产品到购物车（这会创建购物车如果不存在）
      // 暂时不设置 promotion_code，等创建 Promotion 后再更新
      await addToCart({
        variantId: mainVariantId,
        quantity: 1,
        countryCode,
        metadata: {
          bundle_id: bundle.id,
        },
      })

      // 3. 现在购物车已存在，创建单次使用的 Promotion
      console.log("Creating single-use promotion for bundle:", bundle.id)
      const promotionResult = await createBundlePromotion(bundle.id)
      
      if (!promotionResult) {
        throw new Error("Failed to create promotion")
      }

      console.log("Created promotion:", promotionResult.promotion_code)

      // 4. 添加副产品，在 metadata 中标记 bundle_id 和 promotion_code
      for (const product of displayAddonProducts) {
        const variantId =
          selectedVariants[product.id] || product.variants?.[0]?.id

        if (!variantId) continue

        const quantity = quantityMap[product.id] || 1

        await addToCart({
          variantId,
          quantity,
          countryCode,
          metadata: {
            bundle_id: bundle.id,
            promotion_code: promotionResult.promotion_code,
          },
        })
      }

      console.log("All products added to cart with promotion:", promotionResult.promotion_code)

      // 5. 等待一下，确保所有产品都已添加到购物车
      await new Promise((resolve) => setTimeout(resolve, 500))

      // 6. 应用 Promotion（在所有产品都添加到购物车后）
      const { applyPromotions } = await import("@lib/data/cart")
      await applyPromotions([promotionResult.promotion_code])
      console.log("Applied promotion to cart:", promotionResult.promotion_code)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add to cart")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="bg-ui-bg-subtle rounded-lg p-4 relative">
      {/* Bundle 标题和折扣标签 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-ui-fg-base">
            {bundle.title}
          </h3>
          {bundle.description && (
            <p className="text-xs text-ui-fg-subtle mt-0.5 line-clamp-1">
              {bundle.description}
            </p>
          )}
        </div>
        
        {/* 折扣标签 */}
        {showDiscountBadge && (
          <div className="bg-red-500 text-white px-2 py-1 rounded-md font-semibold text-xs flex items-center gap-1 shrink-0 ml-2">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {getDiscountText()}
          </div>
        )}
      </div>

      {/* 产品卡片 - 固定每行 2 个，可展开/折叠 */}
      {showProducts && (
        <div className="mb-4">
          <div className="text-xs text-ui-fg-subtle mb-2">
            Products ({totalProductCount}):
          </div>
          
          {/* 产品网格 - 固定 2 列 */}
          <ul className="grid grid-cols-2 gap-3">
            {visibleProducts.map((product, index) => {
              const qty = index === 0 ? 1 : quantityMap[product.id] || 1
              
              return (
                <li key={product.id}>
                  <BundleProductCard
                    product={product}
                    region={region}
                    quantity={qty}
                    selectedVariantId={selectedVariants[product.id]}
                    onVariantChange={(productId, variantId) => {
                      setSelectedVariants((prev) => ({
                        ...prev,
                        [productId]: variantId,
                      }))
                    }}
                  />
                </li>
              )
            })}
          </ul>

          {/* 展开/折叠按钮 */}
          {needsCollapse && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mt-3 py-1.5 flex items-center justify-center gap-1 text-xs font-medium text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-colors border border-ui-border-base rounded-md hover:border-ui-border-hover"
            >
              {isExpanded ? (
                <>
                  <ChevronUpMini />
                  <span>Show Less</span>
                </>
              ) : (
                <>
                  <ChevronDownMini />
                  <span>Show {hiddenCount} More Product{hiddenCount > 1 ? "s" : ""}</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mb-3 p-2 bg-red-50 text-red-600 text-xs rounded-md">
          {error}
        </div>
      )}

      {/* 价格信息 */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs text-ui-fg-muted">Bundle Price:</span>
        {totalPrice > 0 && (
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-ui-fg-muted line-through">
              {convertToLocale({
                amount: priceInfo.originalPrice,
                currency_code: region.currency_code,
              })}
            </span>
            <span className="text-xl font-bold text-ui-fg-interactive">
              {convertToLocale({
                amount: priceInfo.finalPrice,
                currency_code: region.currency_code,
              })}
            </span>
            <span className="text-xs text-green-600 font-medium">
              (Save {convertToLocale({
                amount: priceInfo.savedAmount,
                currency_code: region.currency_code,
              })})
            </span>
          </div>
        )}
      </div>

      {/* 购买按钮 */}
      <button
        onClick={handleAddToCart}
        disabled={isAdding}
        className="w-full bg-ui-button-neutral text-ui-fg-on-color py-2.5 rounded-md hover:bg-ui-button-neutral-hover transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAdding ? "Adding to Cart..." : ctaText}
      </button>
    </div>
  )
}
