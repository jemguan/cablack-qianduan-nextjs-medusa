import React from "react"
import { HttpTypes } from "@medusajs/types"
import { MedusaConfig } from "@lib/admin-api/config"
import TwoColumnLayout from "../../templates/layouts/two-column-layout"
import ThreeColumnLayout from "../../templates/layouts/three-column-layout"
import { LoyaltyAccount } from "@/types/loyalty"

type OptionTemplate = {
  id: string
  title: string
  description?: string | null
  is_active: boolean
  options?: Array<{
    id: string
    label: string
    image_url?: string | null
    hint_text?: string | null
    price_adjustment: number | string
    sort_order: number
  }>
}

type ProductContentProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  images: HttpTypes.StoreProductImage[]
  initialVariantId?: string
  layout?: 'two-column' | 'three-column'
  shippingReturnsConfig?: MedusaConfig['shippingReturnsConfig']
  htmlDescription?: string | null
  /** 当前登录的客户 */
  customer?: HttpTypes.StoreCustomer | null
  /** 积分账户信息 */
  loyaltyAccount?: LoyaltyAccount | null
  /** 会员产品 ID 列表 */
  membershipProductIds?: Record<string, boolean> | null
  /** 选项模板列表 */
  optionTemplates?: OptionTemplate[]
}

const ProductContent: React.FC<ProductContentProps> = ({
  product,
  region,
  images,
  initialVariantId,
  layout = 'two-column',
  shippingReturnsConfig,
  htmlDescription,
  customer,
  loyaltyAccount,
  membershipProductIds,
  optionTemplates = [],
}) => {
  if (layout === 'three-column') {
    return (
      <ThreeColumnLayout
        product={product}
        region={region}
        images={images}
        initialVariantId={initialVariantId}
        shippingReturnsConfig={shippingReturnsConfig}
        htmlDescription={htmlDescription}
        customer={customer}
        loyaltyAccount={loyaltyAccount}
        membershipProductIds={membershipProductIds}
        optionTemplates={optionTemplates}
      />
    )
  }

  return (
    <TwoColumnLayout
      product={product}
      region={region}
      images={images}
      initialVariantId={initialVariantId}
      shippingReturnsConfig={shippingReturnsConfig}
      htmlDescription={htmlDescription}
      customer={customer}
      loyaltyAccount={loyaltyAccount}
      membershipProductIds={membershipProductIds}
      optionTemplates={optionTemplates}
    />
  )
}

export default ProductContent

