"use client"

import { createContext, useContext, ReactNode } from "react"

// 产品卡片配置类型
export interface ProductCardSettings {
  showSubtitle?: boolean
  buttonBackgroundColor?: string
  brandBadgeColor?: string // 仅 card3 使用
}

export interface ProductCardConfig {
  cardType: 'default' | 'card2' | 'card3'
  default: ProductCardSettings
  card2: ProductCardSettings
  card3: ProductCardSettings & { brandBadgeColor?: string }
}

// 默认配置
export const defaultProductCardConfig: ProductCardConfig = {
  cardType: 'default',
  default: {
    showSubtitle: true,
    buttonBackgroundColor: '#000000',
  },
  card2: {
    showSubtitle: true,
    buttonBackgroundColor: '#000000',
  },
  card3: {
    showSubtitle: true,
    buttonBackgroundColor: '#FFD500',
    brandBadgeColor: '#019038',
  },
}

const ProductCardConfigContext = createContext<ProductCardConfig>(defaultProductCardConfig)

interface ProductCardConfigProviderProps {
  children: ReactNode
  config?: Partial<ProductCardConfig> | null
}

export function ProductCardConfigProvider({
  children,
  config
}: ProductCardConfigProviderProps) {
  // 合并默认配置和传入的配置
  const mergedConfig: ProductCardConfig = {
    cardType: config?.cardType || defaultProductCardConfig.cardType,
    default: {
      ...defaultProductCardConfig.default,
      ...config?.default,
    },
    card2: {
      ...defaultProductCardConfig.card2,
      ...config?.card2,
    },
    card3: {
      ...defaultProductCardConfig.card3,
      ...config?.card3,
    },
  }

  return (
    <ProductCardConfigContext.Provider value={mergedConfig}>
      {children}
    </ProductCardConfigContext.Provider>
  )
}

export function useProductCardConfig() {
  return useContext(ProductCardConfigContext)
}

// 获取当前卡片类型的配置
export function useCurrentCardConfig() {
  const config = useProductCardConfig()
  const cardType = config.cardType

  switch (cardType) {
    case 'card2':
      return { cardType, settings: config.card2 }
    case 'card3':
      return { cardType, settings: config.card3 }
    default:
      return { cardType: 'default' as const, settings: config.default }
  }
}
