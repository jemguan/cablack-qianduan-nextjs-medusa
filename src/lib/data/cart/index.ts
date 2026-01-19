/**
 * Cart Module - Main Entry Point
 *
 * This module provides all cart-related functionality including:
 * - Cart retrieval and management
 * - Cart items (add, update, delete)
 * - Promotions and discounts
 * - Payment and order placement
 * - Shipping methods
 * - Address management
 * - Region updates
 * - Cache management
 * - VIP discounts
 */

// Cache management
export {
  revalidateProductInventoryCache,
  revalidateCartCache,
  revalidateFulfillmentCache,
  revalidateCartAndFulfillmentCache,
} from "./cart-cache"

// VIP discounts
export { tryApplyVipDiscount } from "./cart-vip"

// Cart retrieval and management
export { retrieveCart, getOrSetCart, updateCart } from "./cart-retrieval"

// Cart items operations
export { addToCart, updateLineItem, deleteLineItem } from "./cart-items"

// Promotions and discounts
export {
  applyPromotions,
  removePromotion,
  createBundlePromotion,
  syncBundlePromotions,
  submitPromotionForm,
  applyGiftCard,
  removeDiscount,
  removeGiftCard,
} from "./cart-promotions"

// Payment and order
export { initiatePaymentSession, placeOrder } from "./cart-payment"

// Shipping
export { setShippingMethod, listCartOptions } from "./cart-shipping"

// Address management
export { setAddresses } from "./cart-address"

// Region management
export { updateRegion } from "./cart-region"
