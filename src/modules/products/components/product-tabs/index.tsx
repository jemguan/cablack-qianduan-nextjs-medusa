"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"
import { sanitizeHtml } from "@lib/util/sanitize"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"

type ShippingReturnsConfig = {
  enabled?: boolean;
  items?: Array<{
    id: string;
    icon?: 'fastDelivery' | 'refresh' | 'back' | 'custom';
    customIcon?: string;
    title: string;
    description: string;
  }>;
}

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
  shippingReturnsConfig?: ShippingReturnsConfig
}

const ProductTabs = ({ product, shippingReturnsConfig }: ProductTabsProps) => {
  // Check if product has any information to display
  const hasProductInfo = 
    product.material ||
    product.origin_country ||
    product.type?.value ||
    product.weight ||
    (product.length && product.width && product.height)

  // Check if Shipping & Returns should be shown
  const showShippingReturns = shippingReturnsConfig?.enabled !== false && 
    shippingReturnsConfig?.items && 
    shippingReturnsConfig.items.length > 0

  const tabs = [
    // Only include Product Information tab if there's data to show
    ...(hasProductInfo ? [{
      label: "Product Information",
      component: <ProductInfoTab product={product} />,
    }] : []),
    // Only include Shipping & Returns tab if enabled and has items
    ...(showShippingReturns ? [{
      label: "Shipping & Returns",
      component: <ShippingInfoTab config={shippingReturnsConfig} />,
    }] : []),
  ]

  // Don't render if no tabs
  if (tabs.length === 0) {
    return null
  }

  return (
    <div className="w-full">
      <Accordion type="multiple">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  const infoItems: Array<{ label: string; value: string | null }> = []

  // Only add items that have values
  if (product.material) {
    infoItems.push({ label: "Material", value: product.material })
  }
  if (product.origin_country) {
    infoItems.push({ label: "Country of origin", value: product.origin_country })
  }
  if (product.type?.value) {
    infoItems.push({ label: "Type", value: product.type.value })
  }
  if (product.weight) {
    infoItems.push({ label: "Weight", value: `${product.weight} g` })
  }
  if (product.length && product.width && product.height) {
    infoItems.push({ 
      label: "Dimensions", 
      value: `${product.length}L x ${product.width}W x ${product.height}H` 
    })
  }

  // Don't render if no items
  if (infoItems.length === 0) {
    return null
  }

  // Split items into two columns
  const midPoint = Math.ceil(infoItems.length / 2)
  const leftColumn = infoItems.slice(0, midPoint)
  const rightColumn = infoItems.slice(midPoint)

  return (
    <div className="text-small-regular py-8">
      <div className={`grid gap-x-8 ${rightColumn.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div className="flex flex-col gap-y-4">
          {leftColumn.map((item, index) => (
            <div key={index}>
              <span className="font-semibold">{item.label}</span>
              <p>{item.value}</p>
          </div>
          ))}
        </div>
        {rightColumn.length > 0 && (
        <div className="flex flex-col gap-y-4">
            {rightColumn.map((item, index) => (
              <div key={index}>
                <span className="font-semibold">{item.label}</span>
                <p>{item.value}</p>
          </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const ShippingInfoTab = ({ config }: { config?: ShippingReturnsConfig }) => {
  // Default items if no config provided
  const defaultItems = [
    {
      id: 'fast-delivery',
      icon: 'fastDelivery' as const,
      title: 'Fast delivery',
      description: 'Your package will arrive in 3-5 business days at your pick up location or in the comfort of your home.',
    },
    {
      id: 'simple-exchanges',
      icon: 'refresh' as const,
      title: 'Simple exchanges',
      description: 'Is the fit not quite right? No worries - we\'ll exchange your product for a new one.',
    },
    {
      id: 'easy-returns',
      icon: 'back' as const,
      title: 'Easy returns',
      description: 'Just return your product and we\'ll refund your money. No questions asked – we\'ll do our best to make sure your return is hassle-free.',
    },
  ]

  const items = config?.items && config.items.length > 0 ? config.items : defaultItems

  const getIcon = (iconType?: string, customIcon?: string) => {
    if (customIcon) {
      // If customIcon is a URL, use img tag
      if (customIcon.startsWith('http') || customIcon.startsWith('/')) {
        return <img src={customIcon} alt="" className="w-6 h-6 flex-shrink-0" />
      }
      // Otherwise, treat as SVG - sanitize to prevent XSS
      return <div className="w-6 h-6 flex-shrink-0" dangerouslySetInnerHTML={{ __html: sanitizeHtml(customIcon) }} />
    }

    switch (iconType) {
      case 'fastDelivery':
        return <FastDelivery />
      case 'refresh':
        return <Refresh />
      case 'back':
        return <Back />
      default:
        return <FastDelivery />
    }
  }

  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-1 gap-y-8">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-x-2">
            {getIcon(item.icon, (item as { customIcon?: string }).customIcon)}
          <div>
              <span className="font-semibold">{item.title}</span>
            <p className="max-w-sm">
                {item.description}
            </p>
          </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProductTabs
