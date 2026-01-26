"use client"

import {
  SiVisa,
  SiMastercard,
  SiAmericanexpress,
  SiPaypal,
  SiApplepay,
  SiGooglepay,
  SiStripe,
  SiAlipay,
  SiWechat,
  SiKlarna,
  SiCashapp,
  SiBitcoin,
  SiEthereum,
  SiShopify,
  SiAmazonpay,
} from "react-icons/si"
import {
  FaCcDiscover,
  FaCcDinersClub,
  FaCcJcb,
  FaCreditCard,
  FaMoneyBillWave,
  FaUniversity,
} from "react-icons/fa"

export interface PaymentIconConfig {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  color?: string
}

const PAYMENT_ICONS: Record<string, PaymentIconConfig> = {
  visa: { icon: SiVisa, label: "Visa", color: "#1A1F71" },
  mastercard: { icon: SiMastercard, label: "Mastercard", color: "#EB001B" },
  amex: { icon: SiAmericanexpress, label: "American Express", color: "#006FCF" },
  "american-express": { icon: SiAmericanexpress, label: "American Express", color: "#006FCF" },
  paypal: { icon: SiPaypal, label: "PayPal", color: "#00457C" },
  "apple-pay": { icon: SiApplepay, label: "Apple Pay", color: "#000000" },
  applepay: { icon: SiApplepay, label: "Apple Pay", color: "#000000" },
  "google-pay": { icon: SiGooglepay, label: "Google Pay", color: "#4285F4" },
  googlepay: { icon: SiGooglepay, label: "Google Pay", color: "#4285F4" },
  stripe: { icon: SiStripe, label: "Stripe", color: "#635BFF" },
  alipay: { icon: SiAlipay, label: "Alipay", color: "#1677FF" },
  wechat: { icon: SiWechat, label: "WeChat Pay", color: "#07C160" },
  "wechat-pay": { icon: SiWechat, label: "WeChat Pay", color: "#07C160" },
  wechatpay: { icon: SiWechat, label: "WeChat Pay", color: "#07C160" },
  klarna: { icon: SiKlarna, label: "Klarna", color: "#FFB3C7" },
  cashapp: { icon: SiCashapp, label: "Cash App", color: "#00D632" },
  "cash-app": { icon: SiCashapp, label: "Cash App", color: "#00D632" },
  bitcoin: { icon: SiBitcoin, label: "Bitcoin", color: "#F7931A" },
  btc: { icon: SiBitcoin, label: "Bitcoin", color: "#F7931A" },
  ethereum: { icon: SiEthereum, label: "Ethereum", color: "#627EEA" },
  eth: { icon: SiEthereum, label: "Ethereum", color: "#627EEA" },
  shopify: { icon: SiShopify, label: "Shop Pay", color: "#7AB55C" },
  "shop-pay": { icon: SiShopify, label: "Shop Pay", color: "#7AB55C" },
  shoppay: { icon: SiShopify, label: "Shop Pay", color: "#7AB55C" },
  "amazon-pay": { icon: SiAmazonpay, label: "Amazon Pay", color: "#FF9900" },
  amazonpay: { icon: SiAmazonpay, label: "Amazon Pay", color: "#FF9900" },
  discover: { icon: FaCcDiscover, label: "Discover", color: "#FF6000" },
  "diners-club": { icon: FaCcDinersClub, label: "Diners Club", color: "#0079BE" },
  dinersclub: { icon: FaCcDinersClub, label: "Diners Club", color: "#0079BE" },
  jcb: { icon: FaCcJcb, label: "JCB", color: "#0B4EA2" },
  "credit-card": { icon: FaCreditCard, label: "Credit Card", color: "#666666" },
  creditcard: { icon: FaCreditCard, label: "Credit Card", color: "#666666" },
  card: { icon: FaCreditCard, label: "Card", color: "#666666" },
  cash: { icon: FaMoneyBillWave, label: "Cash", color: "#85BB65" },
  bank: { icon: FaUniversity, label: "Bank Transfer", color: "#2C3E50" },
  "bank-transfer": { icon: FaUniversity, label: "Bank Transfer", color: "#2C3E50" },
  interac: { icon: FaUniversity, label: "Interac", color: "#F7B600" },
  "interac-etransfer": { icon: FaUniversity, label: "Interac e-Transfer", color: "#F7B600" },
  emt: { icon: FaUniversity, label: "EMT", color: "#F7B600" },
}

export function getPaymentIcon(name: string): PaymentIconConfig | null {
  const normalizedName = name.toLowerCase().trim().replace(/\s+/g, "-")
  return PAYMENT_ICONS[normalizedName] || null
}

export function getAvailablePaymentMethods(): Array<{ id: string; label: string }> {
  const seen = new Set<string>()
  const result: Array<{ id: string; label: string }> = []
  
  for (const [key, config] of Object.entries(PAYMENT_ICONS)) {
    if (!seen.has(config.label)) {
      seen.add(config.label)
      result.push({ id: key, label: config.label })
    }
  }
  
  return result.sort((a, b) => a.label.localeCompare(b.label))
}

interface PaymentIconProps {
  name: string
  size?: number
  className?: string
  useColor?: boolean
}

export function PaymentIcon({ name, size = 24, className, useColor = false }: PaymentIconProps) {
  const config = getPaymentIcon(name)
  
  if (!config) {
    return null
  }
  
  const IconComponent = config.icon
  
  if (useColor && config.color) {
    return (
      <span style={{ color: config.color }}>
        <IconComponent size={size} className={className} />
      </span>
    )
  }
  
  return <IconComponent size={size} className={className} />
}

export { PAYMENT_ICONS }
